return {
	"nvim-treesitter/nvim-treesitter",
	dependencies = {
		"nvim-treesitter/nvim-treesitter-textobjects",
		"RRethy/nvim-treesitter-endwise",
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
				"markdown",
				"markdown_inline",
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

			textobjects = {
				select = {
					enable = true,
					lookahead = true,
					keymaps = {
						["am"] = "@function.outer",
						["im"] = "@function.inner",
						["as"] = "@scope.outer",
						["is"] = "@scope.inner",
						["ac"] = "@class.outer",
						["ic"] = "@class.inner",
					},
				},
			},

			move = {
				enable = true,
				set_jumps = true,
				goto_next_start = {
					["]m"] = "@function.outer",
					["]c"] = "@class.outer",
					["]s"] = "@scope.outer",
				},
				goto_previous_start = {
					["[m"] = "@function.outer",
					["[c"] = "@class.outer",
					["[s"] = "@scope.outer",
				},
			},
		})
	end,
}
