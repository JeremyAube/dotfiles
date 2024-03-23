return {
	"rebelot/kanagawa.nvim",
	priority = 1000,
	config = function()
		require("kanagawa").setup({
			functionStyle = {},
			keywordStyle = { italic = false },
			statementStyle = { bold = true },
			typeStyle = { italic = true },
			transparent = true,
			colors = {
				theme = {
					all = {
						ui = {
							float = {
								bg = "none",
							},
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

					NormalFloat = { bg = "none" },
					FloatBorder = { bg = "none" },
					FloatTitle = { bg = "none" },
					NormalDark = { fg = theme.ui.fg_dim, bg = theme.ui.bg_m3 },
					LazyNormal = { bg = theme.ui.bg_m3, fg = theme.ui.fg_dim },
					MasonNormal = { bg = theme.ui.bg_m3, fg = theme.ui.fg_dim },

					-- Popup menues
					Pmenu = { fg = theme.ui.shade0, bg = theme.ui.bg_p1, blend = vim.o.pumblend }, -- add `blend = vim.o.pumblend` to enable transparency
					PmenuSel = { fg = "NONE", bg = theme.ui.bg_p2 },
					PmenuSbar = { bg = theme.ui.bg_m1 },
					PmenuThumb = { bg = theme.ui.bg_p2 },
				}
			end,
			theme = "wave",
		})

		vim.opt.cursorline = true
		vim.cmd("colorscheme kanagawa")
	end,
}
