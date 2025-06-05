return {
	{
		"zbirenbaum/copilot.lua",
		event = "VeryLazy",
		config = function()
			require("copilot").setup({
				copilot_node_command = vim.fn.expand("$HOME") .. "/.asdf/installs/nodejs/22.16.0/bin/node", -- Node.js version must be > 20
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
			provider = "copilot",
			providers = {
				copilot = {
					model = "claude-sonnet-4",
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
			system_prompt = function()
				local hub = require("mcphub").get_hub_instance()
				return hub and hub:get_active_servers_prompt() or ""
			end,
			custom_tools = function()
				return {
					require("mcphub.extensions.avante").mcp_tool(),
				}
			end,
			disabled_tools = {
				"list_files",
				"search_files",
				"read_file",
				"create_file",
				"rename_file",
				"delete_file",
				"create_dir",
				"rename_dir",
				"delete_dir",
				"bash",
			},
			mappings = {
				ask = "<leader>ia",
				new_ask = "<leader>io",
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
		build = "bundled_build.lua",
		config = function()
			require("mcphub").setup({
				extensions = {
					avante = {
						make_slash_commands = true, -- make /slash commands from MCP server prompts
					},
				},
			})
		end,
	},
}
