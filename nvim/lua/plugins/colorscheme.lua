return {
  "catppuccin/nvim",
  name = "catppuccin",
  priority = 1000,
  config = function()
    require("catppuccin").setup({
      flavour = "auto",
      background = {
        light = "latte",
        dark = "mocha",
      },
      show_end_of_buffer = true,
    })

    vim.cmd.colorscheme("catppuccin")
  end,
}
