return {
	"nvim-telescope/telescope.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
	},
	config = function()
		require("telescope").setup({
			defaults = {
				layout_config = {
					prompt_position = "top",
				},
				preview = {
					timeout = 1000,
				},
				layout_strategy = "flex",
				sorting_strategy = "ascending",
				file_ignore_patterns = {
					".elixir_ls",
					"_build",
					"deps/*",
					"node_modules/.*",
					"package-lock.json",
					".git/.*",
				},
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
		vim.keymap.set("n", "<leader>o", function()
			builtin.find_files({ hidden = true })
		end)
		vim.keymap.set("n", "<leader>b", builtin.buffers, {})
		vim.keymap.set("n", "<leader>fs", function()
			builtin.live_grep({ hidden = true })
		end)
		vim.keymap.set("n", "<leader>ff", builtin.current_buffer_fuzzy_find)
		vim.keymap.set("n", "<leader>fd", builtin.lsp_document_symbols)
		vim.keymap.set("n", "<leader>gs", builtin.git_branches)
	end,
}
