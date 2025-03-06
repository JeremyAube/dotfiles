return {
	"rose-pine/neovim",
	name = "rose-pine",
	priority = 1000,
	config = function()
		require("rose-pine").setup({
			variant = "moon",
			dim_inactive_window = true,

			styles = {
				bold = true,
				italic = false,
				transparency = false,
			},

			highlight_groups = {
				Comment = { italic = true },
			},
		})

		vim.cmd.colorscheme("rose-pine")
	end,
}

-- return {
-- 	"jesseleite/nvim-noirbuddy",
-- 	dependencies = {
-- 		{ "tjdevries/colorbuddy.nvim" },
-- 	},
-- 	lazy = false,
-- 	priority = 1000,
-- 	install = { colorscheme = { "noirbuddy" } },
-- 	opts = {
-- 		preset = "kiwi",
-- 	},
-- }
