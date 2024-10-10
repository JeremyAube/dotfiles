return {
	"nvim-telescope/telescope.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"nvim-tree/nvim-web-devicons",
	},
	config = function()
		require("telescope").setup({
			defaults = {
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
						["<esc>"] = require("telescope.actions").close,
					},
					n = {
						["<C-q>"] = require("telescope.actions").smart_send_to_qflist,
					},
				},
			},
		})
		local builtin = require("telescope.builtin")
		local themes = require("telescope.themes")
		vim.keymap.set("n", "<leader>O", function()
			builtin.git_files(themes.get_ivy({}))
		end)
		vim.keymap.set("n", "<leader>o", function()
			builtin.find_files(themes.get_ivy({ hidden = true }))
		end)
		vim.keymap.set("n", "<leader>b", builtin.buffers, {})
		vim.keymap.set("n", "<leader>fs", function()
			builtin.live_grep(themes.get_ivy({ hidden = true }))
		end)
		vim.keymap.set("n", "<leader>ff", function()
			builtin.current_buffer_fuzzy_find(themes.get_ivy({}))
		end)
		vim.keymap.set("n", "<leader>gs", function()
			builtin.git_branches(themes.get_ivy({}))
		end)
	end,
}