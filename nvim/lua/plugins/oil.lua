return {
	"stevearc/oil.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons" },
	config = function()
		vim.api.nvim_create_autocmd("FileType", {
			pattern = "oil",
			callback = function()
				vim.lsp.stop_client(vim.lsp.get_active_clients({ bufnr = 0 }))
			end,
		})

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
		vim.keymap.set("n", "-", vim.cmd.Oil, { desc = "Open file explorer" })
	end,
}
