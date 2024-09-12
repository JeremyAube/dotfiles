vim.g.mapleader = " "

vim.keymap.set("v", "<leader>y", '"+y', { desc = "Yank to system clipboard" })
vim.keymap.set("v", "<leader>p", '"_dP', { desc = "Paste but keep the same text in register" })
vim.keymap.set("n", "<C-d>", "<C-d>zz", { desc = "Center the cursor on half page down" })
vim.keymap.set("n", "<C-u>", "<C-u>zz", { desc = "Center the cursor on half page up" })

-- Move Text
-- ============================================================
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move selected lines up 1 line" })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move selected lines down 1 line" })

-- Diagnostics
-- ============================================================
vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, { desc = "Go to previous diagnostic message" })
vim.keymap.set("n", "]d", vim.diagnostic.goto_next, { desc = "Go to next diagnostic message" })
vim.keymap.set("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Open floating diagnostic message" })
vim.keymap.set("n", "<leader>cl", vim.diagnostic.setloclist, { desc = "Open diagnostics list" })
vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Open code actions" })

-- Quickfix List
-- ============================================================
vim.keymap.set("n", "<leader>qo", ":copen<CR>", { desc = "Open quickfix list" })
vim.keymap.set("n", "<leader>qq", ":cclose<CR>", { desc = "Close quickfix list" })
vim.keymap.set("n", "[q", ":cprev<CR>", { desc = "Move to previous item in quickfix list" })
vim.keymap.set("n", "]q", ":cnext<CR>", { desc = "Move to next item in quickfix list" })

-- Tabs
-- ============================================================
vim.keymap.set("n", "<leader>tq", ":tabclose<CR>", { desc = "Close current tab" })
vim.keymap.set("n", "<leader>tn", ":tabnext<CR>", { desc = "Go to next tab" })
vim.keymap.set("n", "<leader>tp", ":tabprevious<CR>", { desc = "Go to previous tab" })
