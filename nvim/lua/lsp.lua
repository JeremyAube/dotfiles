vim.api.nvim_create_autocmd("LspAttach", {
	callback = function(args)
		local client = assert(vim.lsp.get_client_by_id(args.data.client_id))

		if client:supports_method("textDocument/implementation") then
			vim.keymap.set("n", "grr", "<cmd>Telescope lsp_references theme=ivy<cr>", { buffer = args.buf })
			vim.keymap.set("n", "grc", "<cmd>Telescope lsp_incoming_calls theme=ivy<cr>", { buffer = args.buf })
		end
	end,
})

vim.diagnostic.config({
	title = false,
	underline = true,
	virtual_text = true,
	signs = {
		text = {
			[vim.diagnostic.severity.ERROR] = " ",
			[vim.diagnostic.severity.WARN] = " ",
			[vim.diagnostic.severity.HINT] = "󰠠 ",
			[vim.diagnostic.severity.INFO] = " ",
		},
	},
	update_in_insert = false,
	severity_sort = true,

	float = {
		source = true,
		style = "minimal",
		border = "rounded",
		header = "",
		prefix = "",
	},
})

-- Custom language servers
vim.lsp.enable("expert")
