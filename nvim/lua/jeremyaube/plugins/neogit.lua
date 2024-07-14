return {
	"NeogitOrg/neogit",
	dependencies = {
		"nvim-lua/plenary.nvim", -- required
		"sindrets/diffview.nvim", -- optional - Diff integration
		"nvim-telescope/telescope.nvim", -- optional
	},
	config = function()
		require("neogit").setup()
		vim.keymap.set("n", "<leader>go", ":Neogit<CR>")
		vim.keymap.set("n", "<leader>gp", ":DiffviewFileHistory %<CR>")
	end,
}
