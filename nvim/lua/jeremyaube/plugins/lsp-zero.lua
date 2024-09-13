return {
	"VonHeikemen/lsp-zero.nvim",
	branch = "v2.x",
	dependencies = {
		{ "neovim/nvim-lspconfig" },
		{ "williamboman/mason.nvim" },
		{ "williamboman/mason-lspconfig.nvim" },
	},
	config = function()
		local lsp = require("lsp-zero").preset({})
		lsp.on_attach(function(_, bufnr)
			lsp.default_keymaps({ buffer = bufnr })
			lsp.buffer_autoformat()

			vim.keymap.set("n", "gr", "<cmd>Telescope lsp_references<cr>", { buffer = bufnr })
			vim.keymap.set("n", "gc", "<cmd>Telescope lsp_incoming_calls<cr>", { buffer = bufnr })
		end)
		lsp.setup()

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

		-- Nvim CMP
		-- ============================================================
		local lspkind = require("lspkind")
		local cmp = require("cmp")
		cmp.setup({
			sources = {
				{ name = "nvm_lsp_signature_help" },
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

		-- Format on save
		-- ============================================================
		vim.api.nvim_create_autocmd("BufWritePre", {
			buffer = vim.fn.bufnr(),
			callback = function()
				vim.lsp.buf.format({ timeout_ms = 1000 })
			end,
		})
	end,
}
