return {
	"kvrohit/rasmus.nvim",
	priority = 1000,
	config = function()
		vim.g.rasmus_bold_keywords = true
		vim.g.rasmus_italic_functions = true
		vim.g.rasmus_transparent = true
		vim.cmd([[colorscheme rasmus]])
	end,
}

