return {
	"jellydn/CopilotChat.nvim",
	opts = {
		mode = "split",
		prompts = {
			Explain = "Explain how it works.",
			Tests = "Briefly explain how the selected code works, then generate unit tests.",
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
		{ "<leader>ic", ":CopilotChat " },
		{ "<leader>ie", "<cmd>CopilotChatExplain<cr>" },
		{ "<leader>it", "<cmd>CopilotChatTest<cr>" },
	},
}
