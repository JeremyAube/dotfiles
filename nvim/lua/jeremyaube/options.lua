vim.opt.termguicolors = true

-- Display
-- ============================================================
vim.wo.number = true -- Show line numbers
vim.wo.relativenumber = true -- Show relative line numbers
vim.wo.wrap = false -- Don't wrap lines
vim.opt.hlsearch = false -- Don't highlight search results

-- Completion
-- ============================================================
vim.o.completeopt = "menuone,preview,noinsert,noselect"

-- Indentation
-- ============================================================
vim.opt.smartindent = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.expandtab = true

-- Undo
-- ============================================================
vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true
