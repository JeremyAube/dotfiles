return {
	"stevearc/oil.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons" },
	config = function()
		require("oil").setup({
			default_file_explorer = true,
			column = { "icon" },
			delete_to_trash = true,
			constrain_cursor = "name",
			view_options = {
				show_hidden = true,
			},
			float = {
				padding = 5,
				border = "rounded",
			},
		})

		vim.keymap.set("n", "-", "<cmd>Oil<cr>", { desc = "Open file explorer" })
	end,
}
