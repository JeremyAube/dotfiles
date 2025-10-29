-- Reset existing highlights
vim.cmd("highlight clear")
if vim.fn.exists("syntax_on") then
	vim.cmd("syntax reset")
end

vim.g.colors_name = "custom"

-- Define your color palette here
local colors = {
	-- Background colors
	bg = "#14161b",
	bg_highlight = "#1e2128",

	-- Foreground colors
	fg = "#e8e8e8",
	fg_dark = "#bfb9b9",
	fg_light = "#fcf3e8",

	-- Accent colors
	selection = "#2a2a2a",
	comment = "#515151",
	blue = "#7dcfff",
	blue_bright = "#05d7fc",
	green = "#9ece6a",
	green_bright = "#05fc42",
	green_light = "#bef7c6",
	green_mid = "#82b789",
	magenta = "#bb9af7",
	orange = "#ff9e64",
	purple = "#9d7cd8",
	red = "#d30e12",
	red_bright = "#ff2828",
	yellow = "#e0af68",

	-- Special
	none = "NONE",
}

-- Helper function to set highlights
local function hi(group, opts)
	local cmd = "highlight " .. group
	if opts.fg then
		cmd = cmd .. " guifg=" .. opts.fg
	end
	if opts.bg then
		cmd = cmd .. " guibg=" .. opts.bg
	end
	if opts.style then
		cmd = cmd .. " gui=" .. opts.style
	end
	if opts.sp then
		cmd = cmd .. " guisp=" .. opts.sp
	end
	vim.cmd(cmd)
end

-- Editor UI
hi("Normal", { fg = colors.fg, bg = colors.bg })
hi("NormalFloat", { fg = colors.fg, bg = colors.bg_highlight })
hi("LineNr", { fg = colors.comment })
hi("CursorLine", { bg = colors.bg_highlight })
hi("CursorLineNr", { fg = colors.fg_dark, style = "bold" })
hi("ColorColumn", { bg = colors.bg_highlight })
hi("SignColumn", { bg = colors.bg })
hi("WinSeparator", { fg = colors.orange })
hi("StatusLine", { fg = colors.orange, bg = colors.bg_highlight, style = "bold" })
hi("StatusLineNC", { fg = colors.orange, bg = colors.bg })
hi("Special", { fg = colors.fg })

-- Search
hi("Search", { fg = colors.bg, bg = colors.yellow })
hi("IncSearch", { fg = colors.bg, bg = colors.orange })

-- Selection
hi("Visual", { bg = colors.selection })

-- Messages
hi("ErrorMsg", { fg = colors.red })
hi("WarningMsg", { fg = colors.yellow })

-- Diff
hi("DiffAdd", { fg = colors.green_bright, bg = colors.bg_highlight })
hi("DiffChange", { fg = colors.red_bright, bg = colors.bg })
hi("DiffDelete", { fg = colors.red_bright, bg = colors.bg_highlight })
hi("DiffText", { fg = colors.blue_bright, bg = colors.bg_hightlight })
hi("DiffTextAdd", { fg = colors.green_bright, bg = colors.bg_hightlight })
hi("DiffTextDelete", { fg = colors.red_bright, bg = colors.bg_hightlight })

-- neogim.nvim
hi("NeogitDiffDelete", { fg = colors.red_bright, bg = colors.bg_highlight })
hi("NeogitDiffDeleteCursor", { fg = colors.red_bright, bg = colors.bg })
hi("NeogitDiffDeleteHighlight", { fg = colors.red_bright, bg = colors.bg_highlight })
hi("NeogitChangeDeleted", { fg = colors.red_bright, style = "italic" })

-- diffview.nvim
hi("DiffviewDiffAdd", { fg = colors.green_bright, bg = colors.bg_highlight })
hi("DiffviewDiffText", { fg = colors.blue_bright, bg = colors.bg_highlight })

-- telescope.nvim
hi("TelescopeSelection", { fg = colors.fg, bg = colors.bg_highlight })
hi("TelescopeMatching", { fg = colors.green_mid, bg = colors.bg_highlight, style = "bold" })
hi("TelescopeMultiSelect", { fg = colors.green, bg = colors.bg_highlight, style = "bold" })

-- Oil.nvim
hi("OilDir", { fg = colors.fg, style = "bold" })

-- Quickfix list
hi("QuickFixLine", { fg = colors.none, bg = colors.bg })
hi("qfFileName", { fg = colors.green_light, style = "bold" })
hi("qfLineNr", { fg = colors.comment })
hi("qfText", { fg = colors.fg })
hi("qfMatch", { fg = colors.fg, style = "underline" })

-- LSP
hi("DiagnosticError", { fg = colors.red })
hi("DiagnosticWarn", { fg = colors.yellow })
hi("DiagnosticInfo", { fg = colors.blue_bright }) -- TODO: change this
hi("DiagnosticHint", { fg = colors.blue })
hi("@string", { fg = colors.green_mid })
hi("@string.special.symbol", { fg = colors.fg_light, style = "italic" })
hi("@comment", { fg = colors.comment, style = "italic" })
hi("@punctuation.special", { fg = colors.fg })
hi("@special", { fg = colors.fg })
hi("@tag.heex", { style = "italic" })
hi("@tag.delimiter.heex", { fg = colors.green_light, style = "bold" })

hi("@variable", { fg = colors.fg })
hi("@variable.builtin", { fg = colors.fg })
hi("@function", { fg = colors.fg_light, bg = colors.bg_highlight, style = "bold,italic" })
hi("@function.call", { fg = colors.fg_light, style = "italic" })
hi("@function.builtin", { fg = colors.green_mid, style = "bold,italic" })
hi("@keyword", { fg = colors.green_light })
hi("@keyword.function", { fg = colors.fg })
hi("@operator", { fg = colors.green_light })
hi("@keyword.return", { fg = colors.fg })
hi("@type", { fg = colors.fg })
hi("@type.builtin", { fg = colors.fg })
hi("@property", { fg = colors.fg })
hi("@field", { fg = colors.fg })
hi("@property", { fg = colors.fg })
hi("@field", { fg = colors.fg })
hi("@symbols", { fg = colors.fg })
hi("@constant", { fg = colors.fg })
hi("@constant", { fg = colors.fg })
hi("@markup.raw.block.markdown", { fg = colors.comment })
