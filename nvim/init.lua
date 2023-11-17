require("jeremyaube.keybinds")
require("jeremyaube.lazy")

vim.opt.termguicolors = true
vim.cmd("colorscheme kanagawa")
vim.wo.number = true
vim.wo.relativenumber = true
vim.wo.colorcolumn = "100"
vim.wo.wrap = false

vim.opt.smartindent = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.expandtab = true

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true
