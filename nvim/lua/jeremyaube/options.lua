vim.opt.termguicolors = true

-- Display
-- ============================================================
vim.wo.number = true -- Show line numbers
vim.wo.relativenumber = true -- Show relative line numbers
vim.wo.wrap = false -- Don't wrap lines
vim.opt.hlsearch = false -- Don't highlight search results
vim.opt.incsearch = true -- Incremental search
vim.opt.scrolloff = 10 -- Never have less than 10 lines above or below the cursor
vim.opt.colorcolumn = "80" -- Show a column at 80 characters
vim.opt.cursorline = true -- Highlight the line where the cursor is

-- Search
-- ============================================================
vim.opt.ignorecase = true
vim.opt.smartcase = true

-- Completion
-- ============================================================
vim.o.completeopt = "menuone,preview,noinsert,noselect"

-- Indentation
-- ============================================================
vim.opt.smartindent = true
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.softtabstop = 4
vim.opt.expandtab = true

-- Undo
-- ============================================================
vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true
