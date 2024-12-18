return {
  "stevearc/conform.nvim",
  opts = {
    formatters_by_ft = {
      elixir = { "mix" },
      json = { "jq" },
      lua = { "stylua" },
      typescript = { "prettierd", "prettier", stop_after_first = true },
      yaml = { "prettier" },
    },

    format_after_save = function(buffer)
      if vim.g.disable_autoformat or vim.b[buffer].disable_autoformat then
        return
      end

      return {
        timeout_ms = 1000,
        lsp_fallback = true,
      }
    end,

    formatters = {
      injected = { options = { ignore_errors = true } },
    },
  },
}
