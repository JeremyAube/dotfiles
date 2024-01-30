return {
	"tpope/vim-fugitive",
	dependencies = { "tpope/vim-rhubarb" },
	config = function()
		vim.keymap.set("n", "<leader>go", ":Git<cr>")
		vim.keymap.set("n", "<leader>gc", ":Git commit<cr>")
		vim.keymap.set("n", "<leader>ga", ":Git ")

		vim.keymap.set("n", "<leader>gb", ":Git blame<cr>")
		vim.keymap.set("n", "<leader>gd", ":Gvdiffsplit<cr>")
		vim.keymap.set("n", "<leader>gi", ":GBrowse<cr>")

		vim.keymap.set("n", "<leader>gm", ":Gvdiffsplit!<cr>")
		vim.keymap.set("n", "<leader>gh", ":diffget //2<cr>")
		vim.keymap.set("n", "<leader>gl", ":diffget //3<cr>")
	end,
}
