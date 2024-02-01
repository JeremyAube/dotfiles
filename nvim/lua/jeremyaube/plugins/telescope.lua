return {
	"nvim-telescope/telescope.nvim",
	dependencies = { "nvim-lua/plenary.nvim" },
	config = function()
		local builtin = require("telescope.builtin")

		vim.keymap.set("n", "<leader>O", builtin.git_files)
		vim.keymap.set("n", "<leader>o", builtin.find_files)
		vim.keymap.set("n", "<leader>b", builtin.buffers, {})
		vim.keymap.set("n", "<leader>ff", builtin.current_buffer_fuzzy_find)
		vim.keymap.set("n", "<leader>fs", builtin.live_grep)

		-- Git
		vim.keymap.set("n", "<leader>gu", builtin.git_commits)
		vim.keymap.set("n", "<leader>gs", builtin.git_branches)
	end,
}
