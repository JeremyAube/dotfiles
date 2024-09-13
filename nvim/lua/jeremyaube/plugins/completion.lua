return {
	"hrsh7th/nvim-cmp",
	dependencies = {
		{ "hrsh7th/cmp-nvim-lsp" },
		{ "hrsh7th/cmp-nvim-lua" },
		{ "ray-x/lsp_signature.nvim" },
		{ "onsails/lspkind.nvim" },
	},
	config = function()
		require("lsp_signature").setup({
			hint_enable = false,
		})

		local lspkind = require("lspkind")
		local cmp = require("cmp")
		cmp.setup({
			sources = {
				{ name = "nvim_lua" },
				{ name = "nvim_lsp" },
				{ name = "path" },
				{ name = "buffer" },
			},
			window = {
				completion = cmp.config.window.bordered(),
			},
			formatting = {
				fields = { "abbr", "kind" },
				format = lspkind.cmp_format({
					mode = "symbol_text",
					preset = "codicons",
				}),
			},
		})
	end,
}
