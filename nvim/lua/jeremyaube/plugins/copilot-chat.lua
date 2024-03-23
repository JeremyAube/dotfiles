return {
	"CopilotC-Nvim/CopilotChat.nvim",
	dependencies = {
		{ "nvim-lua/plenary.nvim" }, -- for curl, log wrapper
	},
	opts = {
		mode = "split",
		prompts = {
			Explain = {
				prompt = "/COPILOT_EXPLAIN Write a explanation for the code above as paragraphs of text.",
				mapping = "<leader>ie",
			},
			Tests = {
				prompt = "/COPILOT_TESTS Write a set of detailed unit test functions for the code above.",
				mapping = "<leader>it",
				selection = function(source)
					return require("CopilotChat.select").buffer(source)
				end,
			},
			Fix = {
				prompt = "/COPILOT_FIX There is a problem in this code. Rewrite the code to show it with the bug fixed.",
				mapping = "<leader>if",
			},
			FixDiagnostic = {
				prompt = "Please assist with the following diagnostic issue in file:",
				mapping = "<leader>id",
				selection = function(source)
					return require("CopilotChat.select").diagnostics(source)
				end,
			},
			CommitStaged = {
				prompt = "Write commit message for the change with commitizen convention. Make sure the title has maximum 50 characters and message is wrapped at 72 characters. Wrap the whole message in code block with language gitcommit.",
				mapping = "<leader>ic",
				selection = function(source)
					return require("CopilotChat.select").gitdiff(source, true)
				end,
			},
		},
		window = {
			layout = "vertical", -- 'vertical', 'horizontal', 'float'
			-- relative = "editor", -- 'editor', 'win', 'cursor', 'mouse'
			-- border = "single", -- 'none', single', 'double', 'rounded', 'solid', 'shadow'
			-- width = 0.8, -- fractional width of parent
			-- height = 0.6, -- fractional height of parent
			-- row = nil, -- row position of the window, default is centered
			-- col = nil, -- column position of the window, default is centered
			title = "Copilot Chat", -- title of chat window
			-- footer = nil, -- footer of chat window
			zindex = 1, -- determines if window is on top or below other floating windows
		},
	},
	build = function()
		vim.defer_fn(function()
			vim.cmd("UpdateRemotePlugins")
			vim.notify("CopilotChat - Updated remote plugins. Please restart Neovim.")
		end, 3000)
	end,
	event = "VeryLazy",
	keys = {
		{ "<leader>io", ":CopilotChatToggle<CR>" },
	},
}
