return {
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
		"zbirenbaum/copilot.lua",
	},
	config = {
		provider = "openai",
		openai = {
			endpoint = "https://scout.mirego.com/api/chat/openai_compatible",
			model = "claude-3-5-sonnet-latest",
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
}
