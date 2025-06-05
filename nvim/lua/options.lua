vim.opt.termguicolors = true
vim.o.timeoutlen = 1000

-- Display
-- ============================================================
vim.o.statusline = "%t" -- Just show the file name in the status line
vim.opt.cursorline = true -- Highlight the line where the cursor is
vim.opt.hlsearch = false -- Don't highlight search results
vim.opt.incsearch = true -- Incremental search
vim.opt.scrolloff = 10 -- Never have less than 10 lines above or below the cursor
vim.opt.signcolumn = "yes"
vim.opt.splitkeep = "cursor" -- keep cursor position when resizing
vim.wo.colorcolumn = "100"
vim.wo.number = true -- Show line numbers
vim.wo.relativenumber = true -- Show relative line numbers
vim.wo.wrap = false -- Don't wrap lines

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
vim.opt.smarttab = true
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
