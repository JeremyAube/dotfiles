return {
	"NeogitOrg/neogit",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"sindrets/diffview.nvim",
	},
	config = function()
		require("neogit").setup()
		require("diffview").setup({
			enhanced_diff_hl = true,
		})
		vim.keymap.set("n", "<leader>go", ":Neogit<CR>")
		vim.keymap.set("n", "<leader>gp", ":DiffviewFileHistory %<CR>")
		vim.keymap.set("n", "<leader>gd", ":DiffviewOpen <CR>")
	end,
}
