require("jeremyaube.keybinds")
require("jeremyaube.lazy")

vim.opt.termguicolors = true
vim.wo.number = true
vim.wo.relativenumber = true
vim.wo.wrap = false
vim.o.timeoutlen = 2000

vim.o.ignorecase = true
vim.o.smartcase = true
vim.wo.signcolumn = "yes"
vim.opt.hlsearch = false
vim.o.completeopt = "menuone,noselect"
local highlight_group = vim.api.nvim_create_augroup("YankHighlight", { clear = true })
vim.api.nvim_create_autocmd("TextYankPost", {
	callback = function()
		vim.highlight.on_yank()
	end,
	group = highlight_group,
	pattern = "*",
})

vim.opt.smartindent = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.softtabstop = 2
vim.opt.expandtab = true

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true

vim.cmd("highlight Normal guibg=none")
vim.cmd("highlight NonText guibg=none")
vim.cmd("highlight Normal ctermbg=none")
vim.cmd("highlight NonText ctermbg=none")
