return {
	"nvim-telescope/telescope.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	config = function()
		require("telescope").setup({
			defaults = {
				layout_config = {
					prompt_position = "top",
				},
				layout_strategy = "flex",
				sorting_strategy = "ascending",
				mappings = {
					i = {
						["<C-q>"] = require("telescope.actions").smart_send_to_qflist,
					},
					n = {
						["<C-q>"] = require("telescope.actions").smart_send_to_qflist,
					},
				},
			},
		})
		local builtin = require("telescope.builtin")
		vim.keymap.set("n", "<leader>O", builtin.git_files)
		vim.keymap.set("n", "<leader>o", builtin.find_files)
		vim.keymap.set("n", "<leader>b", builtin.buffers, {})
		vim.keymap.set("n", "<leader>fs", builtin.live_grep)
		vim.keymap.set("n", "<leader>ff", builtin.current_buffer_fuzzy_find)
		vim.keymap.set("n", "<leader>fd", builtin.lsp_document_symbols)
		vim.keymap.set("n", "<leader>gs", builtin.git_branches)
	end,
}
