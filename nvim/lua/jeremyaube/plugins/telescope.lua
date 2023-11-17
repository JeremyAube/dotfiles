return {
  "nvim-telescope/telescope.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    local builtin = require("telescope.builtin")

    vim.keymap.set("n", "<leader>o", builtin.git_files)
    vim.keymap.set("n", "<leader>O", builtin.find_files)
    vim.keymap.set("n", "<leader>fh", builtin.current_buffer_fuzzy_find)
    vim.keymap.set("n", "<leader>b", builtin.buffers, {})
    vim.keymap.set("n", "<leader>fl", builtin.git_commits)
    vim.keymap.set("n", "<leader>fb", builtin.git_branches)
    vim.keymap.set("n", "<leader>fs", function()
      builtin.grep_string({ search = vim.fn.input("Grep > ") })
    end)
  end,
}
