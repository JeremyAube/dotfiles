return {
	{
		"zbirenbaum/copilot.lua",
		event = "VeryLazy",
		config = function()
			require("copilot").setup({
				suggestion = {
					auto_trigger = true,
					hide_during_completion = false,
					keymap = {
						accept = "<C-Enter>",
						next = "<C-j>",
						prev = "<C-k>",
						dismiss = "<C-e>",
					},
				},
			})
		end,
	},
	{
		"yetone/avante.nvim",
		event = "VeryLazy",
		lazy = false,
		version = false,
		build = "make",
		dependencies = {
			-- required
			"nvim-treesitter/nvim-treesitter",
			"stevearc/dressing.nvim",
			"nvim-lua/plenary.nvim",
			"MunifTanjim/nui.nvim",

			-- optional
			"nvim-telescope/telescope.nvim",
			"zbirenbaum/copilot.lua",
		},
		config = {
			provider = "scout",
			vendors = {
				scout = {
					__inherited_from = "openai",
					api_key_name = "SCOUT_API_KEY",
					endpoint = "https://scout.mirego.com/api/chat/openai_compatible",
					model = "gpt-4-1",
				},
			},
			hints = { enabled = false },
			windows = {
				width = 40,
				sidebar_header = {
					align = "center", -- left, center, right for title
					rounded = false,
				},
			},
			input = {
				prefix = "",
				height = 6,
			},
			mappings = {
				ask = "<leader>io",
				new_ask = "<leader>in",
				edit = "<leader>ie",
				refresh = "<leader>ir",
				focus = "<leader>if",
				stop = "<leader>iS",
				toggle = {
					default = "<leader>it",
					debug = "<leader>id",
					hint = "<leader>ih",
					suggestion = "<leader>is",
					repomap = "<leader>iR",
				},
				files = {
					add_current = "<leader>ib", -- Add current buffer to selected files
					add_all_buffers = "<leader>iB", -- Add all buffer files to selected files
				},
				select_model = "<leader>i?", -- Select model command
				select_history = "<leader>ih", -- Select history command
			},
		},
	},
	{
		"ravitemer/mcphub.nvim",
		dependencies = {
			"nvim-lua/plenary.nvim",
		},
		build = "npm install -g mcp-hub@latest",
		config = function()
			require("mcphub").setup()
		end,
	},
}
