return {
	"gptlang/CopilotChat.nvim",
	config = function()
		vim.keymap.set("n", "<leader>i", ":CopilotChat ")
	end,
}
