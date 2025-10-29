vim.diagnostic.config({
	title = false,
	underline = true,
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
