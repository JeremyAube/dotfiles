return {
	"nvim-treesitter/nvim-treesitter",
	dependencies = {
		"RRethy/nvim-treesitter-endwise",
		"windwp/nvim-ts-autotag",
	},
	build = ":TSUpdate",
	event = { "BufReadPre", "BufNewFile" },
	config = function()
		require("nvim-treesitter.configs").setup({
			ensure_installed = {
				"lua",
				"typescript",
				"tsx",
				"html",
				"css",
			},
			endwise = {
				enable = true,
			},
			sync_install = false,
			auto_install = true,

			build = ":TSUpdate",
			event = { "BufRead", "BufNewFile" },

			highlight = {
				enable = true,
				additional_vim_regex_highlighting = false,
			},

			indent = { enabled = true },
		})

		require("nvim-ts-autotag").setup()
	end,
}
