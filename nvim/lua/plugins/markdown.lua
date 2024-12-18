return {
  "MeanderingProgrammer/render-markdown.nvim",
  dependencies = {
    "nvim-treesitter/nvim-treesitter",
    "nvim-tree/nvim-web-devicons",
  },
  opts = {
    win_options = {
      -- See :h 'conceallevel'
      conceallevel = {
        -- Used when not being rendered, get user setting
        default = vim.api.nvim_get_option_value("conceallevel", {}),
        -- Used when being rendered, concealed text is completely hidden
        rendered = 3,
      },
    },
  },
}
