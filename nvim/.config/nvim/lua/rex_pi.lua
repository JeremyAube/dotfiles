local M = {}

local last_pi_block_id = nil

local function notify(msg, level)
  vim.schedule(function()
    vim.notify(msg, level or vim.log.levels.INFO, { title = "rex-pi" })
  end)
end

local function rex_env()
  local session_id = vim.env.REX_SESSION
  local block_id = vim.env.REX_BLOCK
  if not session_id or session_id == "" then
    notify("Not running inside a Rex session (REX_SESSION is unset)", vim.log.levels.ERROR)
    return nil, nil
  end
  return session_id, block_id
end

local function run_rex(args, callback)
  vim.system(vim.list_extend({ "rex" }, args), { text = true }, function(res)
    if res.code ~= 0 then
      local err = vim.trim((res.stderr or "") .. " " .. (res.stdout or ""))
      callback(nil, err ~= "" and err or ("rex exited with code " .. res.code))
      return
    end
    callback(res.stdout or "", nil)
  end)
end

local function run_rex_json(args, callback)
  run_rex(args, function(stdout, err)
    if err then
      callback(nil, err)
      return
    end
    local ok, decoded = pcall(vim.json.decode, stdout)
    if not ok then
      callback(nil, "Failed to parse JSON from rex: " .. tostring(decoded))
      return
    end
    callback(decoded, nil)
  end)
end

local function get_selection_ref(opts)
  local buf = vim.api.nvim_get_current_buf()
  local path = vim.api.nvim_buf_get_name(buf)
  if path == "" then
    return nil, "Current buffer has no file path"
  end

  -- Strip oil:// or similar URI prefixes if needed, otherwise keep relative to cwd
  local rel_path = vim.fn.fnamemodify(path, ":.")

  local start_line, end_line
  local mode = vim.fn.mode()
  if mode == "v" or mode == "V" or mode == "\22" then
    local v_pos = vim.fn.getpos("v")
    local cur_pos = vim.fn.getpos(".")
    start_line = v_pos[2]
    end_line = cur_pos[2]
    -- Exit visual mode cleanly after capturing the selection
    local esc = vim.api.nvim_replace_termcodes("<Esc>", true, false, true)
    vim.api.nvim_feedkeys(esc, "nx", false)
  elseif opts and opts.range and opts.range > 0 then
    start_line = opts.line1
    end_line = opts.line2
  else
    start_line = vim.api.nvim_win_get_cursor(0)[1]
    end_line = start_line
  end

  if start_line > end_line then
    start_line, end_line = end_line, start_line
  end

  if start_line == end_line then
    return string.format("%s:%d ", rel_path, start_line), nil
  end
  return string.format("%s:%d-%d ", rel_path, start_line, end_line), nil
end

local function paste_to_block(session_id, block_id, text, callback)
  local payload = vim.json.encode({
    block_id = block_id,
    event = {
      type = "paste",
      payload = {
        text = text,
      },
    },
  })
  run_rex({ "api", "call", "-s", session_id, "block.event", payload }, callback)
end

local function focus_block(session_id, block_id, callback)
  run_rex({ "focus", "-s", session_id, block_id }, function(_, err)
    if err then
      -- Fallback to explicit API call in case focus CLI rejects anything
      local payload = vim.json.encode({ block_id = block_id })
      run_rex({ "api", "call", "-s", session_id, "session.focus_block", payload }, callback)
      return
    end
    callback(true, nil)
  end)
end

local function is_pi_ready(session_id, block_id, callback)
  run_rex_json({ "block", "call", "-s", session_id, "-b", block_id, "program_status" }, function(status, err)
    if not err and status and status.records then
      for _, rec in ipairs(status.records) do
        if rec.app == "pi" or rec.effective_app == "pi" then
          callback(true)
          return
        end
      end
    end

    run_rex_json({ "block", "call", "-s", session_id, "-b", block_id, "title" }, function(title_res, title_err)
      if not title_err and title_res and type(title_res.title) == "string" then
        if title_res.title:find("^π") then
          callback(true)
          return
        end
      end
      callback(false)
    end)
  end)
end

local function wait_for_pi_and_paste(session_id, block_id, text)
  local attempts = 0
  local max_attempts = 60 -- 60 * 100ms = 6 seconds
  local timer = vim.uv.new_timer()

  local function stop_timer()
    if timer and not timer:is_closing() then
      timer:stop()
      timer:close()
    end
  end

  timer:start(150, 100, function()
    attempts = attempts + 1
    is_pi_ready(session_id, block_id, function(ready)
      if ready or attempts >= max_attempts then
        stop_timer()
        paste_to_block(session_id, block_id, text, function(_, err)
          if err then
            notify("Failed to send text to Pi: " .. err, vim.log.levels.ERROR)
          end
        end)
      end
    end)
  end)
end

function M.new_split(opts)
  local session_id, block_id = rex_env()
  if not session_id then
    return
  end

  local ref, ref_err = get_selection_ref(opts)
  if not ref then
    notify(ref_err, vim.log.levels.WARN)
    return
  end

  local cwd = vim.fn.getcwd()
  local args = { "split", "-s", session_id }
  if block_id and block_id ~= "" then
    table.insert(args, "-b")
    table.insert(args, block_id)
  end
  vim.list_extend(args, {
    "--split=right",
    "--ratio",
    "40",
    "--label",
    "pi",
    "-c",
    cwd,
    "--json",
    "--",
    "ai",
  })

  run_rex_json(args, function(res, err)
    if err then
      notify("Failed to open Pi split: " .. err, vim.log.levels.ERROR)
      return
    end
    local new_block_id = res and res.block_ids and res.block_ids[1]
    if not new_block_id then
      notify("Rex split did not return a block ID", vim.log.levels.ERROR)
      return
    end
    last_pi_block_id = new_block_id
    wait_for_pi_and_paste(session_id, new_block_id, ref)
  end)
end

local function inspect_block_for_pi(session_id, block_info, callback)
  local block_id = block_info.block_id
  local pending = 3
  local proc_res, status_res, title_res

  local function finish()
    pending = pending - 1
    if pending > 0 then
      return
    end

    local is_pi = false
    if status_res and status_res.records then
      for _, rec in ipairs(status_res.records) do
        if rec.app == "pi" or rec.effective_app == "pi" then
          is_pi = true
          break
        end
      end
    end

    if not is_pi and proc_res and proc_res.foreground then
      local fg = proc_res.foreground
      if fg.argv0 == "pi" then
        is_pi = true
      end
    end

    if not is_pi and title_res and type(title_res.title) == "string" and title_res.title:find("^π") then
      is_pi = true
    end

    if not is_pi then
      callback(nil)
      return
    end

    local state = nil
    if status_res and status_res.records and status_res.records[1] then
      state = status_res.records[1].state
    end

    local title = (title_res and title_res.title ~= "" and title_res.title) or block_info.label or "pi"
    local cwd = proc_res and proc_res.foreground and proc_res.foreground.cwd or nil

    callback({
      block_id = block_id,
      window_id = block_info.window_id,
      window_label = block_info.window_label,
      window_index = block_info.window_index,
      title = title,
      state = state,
      cwd = cwd,
    })
  end

  run_rex_json({ "block", "call", "-s", session_id, "-b", block_id, "process" }, function(res)
    proc_res = res
    finish()
  end)

  run_rex_json({ "block", "call", "-s", session_id, "-b", block_id, "program_status" }, function(res)
    status_res = res
    finish()
  end)

  run_rex_json({ "block", "call", "-s", session_id, "-b", block_id, "title" }, function(res)
    title_res = res
    finish()
  end)
end

local function collect_session_blocks(session_view)
  local items = {}
  local seen = {}
  for idx, win in ipairs(session_view.windows or {}) do
    local win_label = (win.label and win.label ~= "" and win.label) or ("Tab " .. idx)
    for _, layer in ipairs(win.layers or {}) do
      for _, block in ipairs(layer.blocks or {}) do
        if block.block_id and not seen[block.block_id] and block.creator_name == "com.superlogical.terminal" then
          seen[block.block_id] = true
          table.insert(items, {
            block_id = block.block_id,
            label = block.label,
            window_id = win.window_id,
            window_label = win_label,
            window_index = idx,
          })
        end
      end
    end
  end
  return items
end

local function send_and_focus(session_id, block_id, ref)
  last_pi_block_id = block_id
  paste_to_block(session_id, block_id, ref, function(_, err)
    if err then
      notify("Failed to paste to Pi block: " .. err, vim.log.levels.ERROR)
      return
    end
    focus_block(session_id, block_id, function(_, focus_err)
      if focus_err then
        notify("Sent text, but failed to focus Pi block: " .. focus_err, vim.log.levels.WARN)
      end
    end)
  end)
end

function M.pick_and_send(opts)
  local session_id, current_block_id = rex_env()
  if not session_id then
    return
  end

  local ref, ref_err = get_selection_ref(opts)
  if not ref then
    notify(ref_err, vim.log.levels.WARN)
    return
  end

  run_rex_json({ "session", "inspect", session_id, "--json" }, function(view, err)
    if err then
      notify("Failed to inspect Rex session: " .. err, vim.log.levels.ERROR)
      return
    end

    local blocks = collect_session_blocks(view)
    local candidates = {}
    for _, b in ipairs(blocks) do
      if b.block_id ~= current_block_id then
        table.insert(candidates, b)
      end
    end

    if #candidates == 0 then
      notify("No other terminal panes found in this Rex session", vim.log.levels.WARN)
      return
    end

    local pi_sessions = {}
    local pending = #candidates

    for _, b in ipairs(candidates) do
      inspect_block_for_pi(session_id, b, function(pi_info)
        if pi_info then
          table.insert(pi_sessions, pi_info)
        end
        pending = pending - 1
        if pending == 0 then
          vim.schedule(function()
            if #pi_sessions == 0 then
              notify("No open Pi sessions in this Rex session", vim.log.levels.WARN)
              return
            end

            table.sort(pi_sessions, function(a, b2)
              if a.window_index ~= b2.window_index then
                return a.window_index < b2.window_index
              end
              return a.block_id < b2.block_id
            end)

            vim.ui.select(pi_sessions, {
              prompt = "Select Pi session:",
              format_item = function(item)
                local parts = {
                  string.format("[%d: %s]", item.window_index, item.window_label),
                  item.title,
                }
                if item.state then
                  table.insert(parts, "(" .. item.state .. ")")
                end
                if item.cwd then
                  table.insert(parts, "— " .. vim.fn.fnamemodify(item.cwd, ":~"))
                end
                return table.concat(parts, " ")
              end,
            }, function(choice)
              if choice then
                send_and_focus(session_id, choice.block_id, ref)
              end
            end)
          end)
        end
      end)
    end
  end)
end

function M.send_to_last(opts)
  local session_id = rex_env()
  if not session_id then
    return
  end

  if not last_pi_block_id then
    M.pick_and_send(opts)
    return
  end

  local ref, ref_err = get_selection_ref(opts)
  if not ref then
    notify(ref_err, vim.log.levels.WARN)
    return
  end

  -- Verify the remembered block still exists in this session
  run_rex_json({ "block", "ls", "-s", session_id, "--json" }, function(res, err)
    if not err and res and res.blocks then
      for _, b in ipairs(res.blocks) do
        if b.block_id == last_pi_block_id then
          send_and_focus(session_id, last_pi_block_id, ref)
          return
        end
      end
    end
    last_pi_block_id = nil
    vim.schedule(function()
      M.pick_and_send(opts)
    end)
  end)
end

function M.setup()
  vim.api.nvim_create_user_command("RexPiSplit", function(opts)
    M.new_split(opts)
  end, { range = true, desc = "Open Pi in a new Rex split and send selection" })

  vim.api.nvim_create_user_command("RexPiSend", function(opts)
    M.pick_and_send(opts)
  end, { range = true, desc = "Pick an open Pi session in this Rex session and send selection" })

  vim.api.nvim_create_user_command("RexPiLast", function(opts)
    M.send_to_last(opts)
  end, { range = true, desc = "Send selection to the last used Pi session" })
end

return M
