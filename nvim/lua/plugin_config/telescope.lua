local builtin = require('telescope.builtin')

vim.keymap.set('n', '<leader>O', builtin.git_files)
vim.keymap.set('n', '<leader>o', builtin.find_files)
vim.keymap.set('n', '<leader>b', builtin.buffers, {})
vim.keymap.set('n', '<leader>fs', function()
  builtin.grep_string({ search = vim.fn.input("Grep > ") });
end)
