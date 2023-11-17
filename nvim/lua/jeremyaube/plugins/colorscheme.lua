return {
	"rebelot/kanagawa.nvim",
	priority = 1000,
	opts = {
		functionStyle = {},
		keywordStyle = { italic = false },
		statementStyle = { bold = true },
		typeStyle = { italic = true },
		colors = {
			theme = {
				all = {
					ui = {
						bg_gutter = "none",
					},
				},
			},
		},
		overrides = function(colors) -- add/modify highlights
			local theme = colors.theme

			return {
				-- Telescope
				TelescopeTitle = { fg = theme.syn.constant, bold = true },
				TelescopeResultsNormal = { fg = theme.syn.comment },
				TelescopeMatching = { fg = theme.syn.constant },

				-- Popup menues
				Pmenu = { fg = theme.ui.shade0, bg = theme.ui.bg_p1 }, -- add `blend = vim.o.pumblend` to enable transparency
				PmenuSel = { fg = "NONE", bg = theme.ui.bg_p2 },
				PmenuSbar = { bg = theme.ui.bg_m1 },
				PmenuThumb = { bg = theme.ui.bg_p2 },
			}
		end,
		theme = "wave",
		background = {
			dark = "wave",
			light = "lotus",
		},
	},
	config = function()
		vim.opt.cursorline = true
		vim.cmd("colorscheme kanagawa")
	end,
}
