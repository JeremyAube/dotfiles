return {
	"mason-org/mason.nvim",
	dependencies = {
		"mason-org/mason-lspconfig.nvim",
		"neovim/nvim-lspconfig",
	},
	config = function()
		require("mason").setup({})
		require("mason-lspconfig").setup({
			ensure_installed = {
				"lexical",
				"ts_ls",
				"lua_ls",
			},
		})

		require("lspconfig").lexical.setup({
			cmd = { "/Users/jeremy/.local/bin/expert_darwin_arm64" },
			root_dir = function(fname)
				return require("lspconfig").util.root_pattern("mix.exs", ".git")(fname) or vim.loop.cwd()
			end,
			filetypes = { "elixir", "eelixir", "heex" },
			-- optional settings
			settings = {},
		})
	end,
}
