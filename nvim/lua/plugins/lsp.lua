return {
	"VonHeikemen/lsp-zero.nvim",
	branch = "v2.x",
	dependencies = {
		"neovim/nvim-lspconfig",
		"williamboman/mason.nvim",
		"williamboman/mason-lspconfig.nvim",
		"saghen/blink.cmp",
	},
	config = function()
		local capabilities = require("blink.cmp").get_lsp_capabilities()
		local lsp = require("lsp-zero").preset({ capabilities = capabilities })
		lsp.on_attach(function(_, bufnr)
			lsp.default_keymaps({ buffer = bufnr })

			vim.keymap.set("n", "gr", "<cmd>Telescope lsp_references theme=ivy<cr>", { buffer = bufnr })
			vim.keymap.set("n", "gc", "<cmd>Telescope lsp_incoming_calls theme=ivy<cr>", { buffer = bufnr })
		end)
		lsp.setup()

		require("mason").setup()

		local lspconfig = require("lspconfig")
		lspconfig.lua_ls.setup({
			settings = {
				Lua = {
					diagnostics = {
						globals = { "vim" },
					},
				},
			},
		})

		lspconfig.html.setup({
			filetypes = { "html", "heex" },
		})

		lspconfig.tailwindcss.setup({
			settings = {
				tailwindCSS = {
					includeLanguages = {
						elixir = "html-eex",
						eelixir = "html-eex",
						heex = "html-eex",
					},
					experimental = {
						classRegex = {
							'class[:]\\s*"([^"]*)"',
						},
					},
				},
			},
		})

		-- LSP Diagnostics
		-- ============================================================
		vim.diagnostic.config({
			title = false,
			underline = true,
			virtual_text = true,
			signs = true,
			update_in_insert = false,
			severity_sort = true,

			float = {
				source = "always",
				style = "minimal",
				border = "rounded",
				header = "",
				prefix = "",
			},
		})
		local signs = { Error = " ", Warn = " ", Hint = "󰠠 ", Info = " " }
		for type, icon in pairs(signs) do
			local hl = "DiagnosticSign" .. type
			vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = "" })
		end
	end,
}
