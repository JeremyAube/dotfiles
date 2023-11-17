return {
  "nvim-treesitter/nvim-treesitter",
  dependencies = { "nvim-treesitter/nvim-treesitter-textobjects" },
  config = function()
    require("nvim-treesitter.configs").setup({
      -- A list of parser names, or "all" (the five listed parsers should always be installed)
      ensure_installed = { "lua", "typescript", "tsx" },
      sync_install = false,
      auto_install = true,

      build = ":TSUpdate",
      event = { "BufRead", "BufNewFile" },

      highlight = {
        enable = true,
        additional_vim_regex_highlighting = false,
      },

      indent = { enabled = true },

      textobjects = {
        select = {
          enable = true,
          keymaps = {
            ["af"] = "@function.outer",
            ["if"] = "@function.inner",
          },
        },
      },

      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<C-space>",
          node_incremental = "<C-space>",
          scope_incremental = false,
          node_decremental = "<bs>",
        },
      },

      swap = {
        enable = true,
        swap_next = {
          ["<leader>sn"] = "@parameter.inner",
        },
        swap_previous = {
          ["<leader>sp"] = "@parameter.inner",
        },
      },

      move = {
        enable = true,
        set_jumps = true,
        goto_next_start = {
          ["]m"] = "@function.outer",
          ["]]"] = "@class.outer",
          ["]s"] = "@scope",
        },
        goto_previous_start = {
          ["[m"] = "@function.outer",
          ["[["] = "@class.outer",
          ["[s"] = "@scope",
        },
      },
    })
  end,
}
