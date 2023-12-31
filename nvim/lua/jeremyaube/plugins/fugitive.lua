return {
	"tpope/vim-fugitive",
	dependencies = { "tpope/vim-rhubarb" },
	config = function()
		vim.keymap.set("n", "<leader>go", ":Git<cr>")
		vim.keymap.set("n", "<leader>gc", ":Git commit<cr>")
		vim.keymap.set("n", "<leader>gP", ":Git push<cr>")
		vim.keymap.set("n", "<leader>gp", ":Git pull<cr>")

		vim.keymap.set("n", "<leader>gb", ":Git blame<cr>")
		vim.keymap.set("n", "<leader>gd", ":Gvdiffsplit<cr>")
		vim.keymap.set("n", "<leader>gi", ":GBrowse<cr>")
	end,
}
