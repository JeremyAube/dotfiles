return {
	"kvrohit/rasmus.nvim",
	priority = 1000,
	config = function()
		vim.g.rasmus_bold_keywords = true
		vim.g.rasmus_italic_functions = true
		vim.g.rasmus_transparent = true
		vim.cmd([[colorscheme rasmus]])

		local colors = require("rasmus.colors").dark
		vim.api.nvim_set_hl(0, "DiffAdd", { fg = colors.bright_greed, bg = colors.gray01 })
		vim.api.nvim_set_hl(0, "DiffDelete", { fg = colors.bright_red, bg = colors.gray01 })
		vim.api.nvim_set_hl(0, "DiffText", { fg = colors.bright_blue, bg = colors.gray01 })
		vim.api.nvim_set_hl(0, "DiffChange", { fg = colors.bright_blue, bg = colors.gray01 })
	end,
}
