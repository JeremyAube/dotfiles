-- ========== Yank =====================
vim.keymap.set("v", "<leader>y", '"+y', { desc = "Yank to system clipboard" })
vim.keymap.set("v", "<leader>p", '"_dP', { desc = "Paste but keep the same text in register" })
vim.keymap.set("n", "x", '"_x', { desc = "Don't replace content in default yank register when using x" })

-- =========== Navigation ==============
vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = "Center the cursor on half page down" })
vim.keymap.set("n", "<C-u>", "<C-u>zz", { desc = "Center the cursor on half page up" })
vim.keymap.set("n", "L", "50l", { desc = "Move horizontally 50 characters to the right" }) -- Horizontal scroll for long log lines
vim.keymap.set("n", "H", "50h", { desc = "Move horizontally 50 characters to the left" }) -- Horizontal scroll for long log lines

-- ========== Indentation ==============
vim.keymap.set("v", ">", ">gv|", { noremap = true })
vim.keymap.set("v", "<", "<gv", { noremap = true })

-- ========== LSP ======================
vim.keymap.set("n", "<leader>d", vim.diagnostic.open_float, { desc = "Open floating diagnostic message" })
-- vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Open code actions" })

-- ========== Quickfix List ============
vim.keymap.set("n", "<leader>qo", ":copen<CR>", { desc = "Open quickfix list" })
vim.keymap.set("n", "<leader>qc", ":cclose<CR>", { desc = "Close quickfix list" })

-- ========= Tabs ======================
vim.keymap.set("n", "<leader>tq", ":tabclose<CR>", { desc = "Close current tab" })
vim.keymap.set("n", "<leader>tn", ":tabnew<CR>", { desc = "Open a new tab" })
vim.keymap.set("n", "<leader>tl", ":tabnext<CR>", { desc = "Open a new tab" })
vim.keymap.set("n", "<leader>th", ":tabprev<CR>", { desc = "Open a new tab" })
