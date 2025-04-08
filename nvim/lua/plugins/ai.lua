return {
	"github/copilot.vim",
	{
		"yetone/avante.nvim",
		event = "VeryLazy",
		lazy = false,
		version = false,
		build = "make",
		dependencies = {
			"nvim-treesitter/nvim-treesitter",
			"stevearc/dressing.nvim",
			"nvim-lua/plenary.nvim",
			"MunifTanjim/nui.nvim",
		},
		config = {
			provider = "scout",
			vendors = {
				scout = {
					__inherited_from = "openai",
					api_key_name = "SCOUT_API_KEY",
					endpoint = "https://scout.mirego.com/api/chat/openai_compatible",
					model = "gpt-4o",
				},
			},
			auto_suggestions_provider = "copilot",
			hints = { enabled = false },
			windows = {
				width = 40,
				sidebar_header = {
					align = "center", -- left, center, right for title
					rounded = false,
				},
			},
		},
	},
}
