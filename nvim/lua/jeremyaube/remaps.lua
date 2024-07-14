-- General
-- ============================================================
vim.g.mapleader = " "

vim.keymap.set("v", "<leader>y", '"+y')
vim.keymap.set("v", "<leader>p", '"_dP')
vim.keymap.set("n", "<C-d>", "<C-d>zz")
vim.keymap.set("n", "<C-u>", "<C-u>zz")

-- Move Text
-- ============================================================
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

vim.keymap.set("n", "J", "mzJ`z")

-- Diagnostics
-- ============================================================
vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, { desc = "Go to previous diagnostic message" })
vim.keymap.set("n", "]d", vim.diagnostic.goto_next, { desc = "Go to next diagnostic message" })
vim.keymap.set("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Open floating diagnostic message" })
vim.keymap.set("n", "<leader>cl", vim.diagnostic.setloclist, { desc = "Open diagnostics list" })
vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Open code actions" })

-- Quickfix List
-- ============================================================
vim.keymap.set("n", "<leader>q", ":copen<CR>", { desc = "Open quickfix list" })
vim.keymap.set("n", "[q", ":cprev<CR>", { desc = "Move to previous item in quickfix list" })
vim.keymap.set("n", "]q", ":cnext<CR>", { desc = "Move to next item in quickfix list" })
