return {
  "tpope/vim-fugitive",
  depedendencies = { "tpope/vim-rhubarb" },
  config = function()
    vim.keymap.set("n", "<leader>go", ":Git<cr>")
    vim.keymap.set("n", "<leader>gc", ":Git commit<cr>")
    vim.keymap.set("n", "<leader>gb", ":Git blame<cr>")
    vim.keymap.set("n", "<leader>gd", ":Gvdiffsplit<cr>")
    vim.keymap.set("n", "<leader>gv", ":GBrowse<cr>")
  end
}
