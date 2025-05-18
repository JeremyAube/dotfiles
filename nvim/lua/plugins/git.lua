return {
	"NeogitOrg/neogit",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"sindrets/diffview.nvim",
		"FabijanZulj/blame.nvim",
	},
	config = function()
		require("neogit").setup()
		require("diffview").setup({
			enhanced_diff_hl = true,
		})
		require("blame").setup()

		vim.keymap.set("n", "<leader>gb", ":BlameToggle<CR>")
		vim.keymap.set("n", "<leader>go", ":Neogit<CR>")
		vim.keymap.set("n", "<leader>gp", ":DiffviewFileHistory %<CR>")
		vim.keymap.set("n", "<leader>gd", ":DiffviewOpen <CR>")
	end,
}
