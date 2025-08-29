return {
	cmd = { "my/home/projects/expert/apps/expert/burrito_out/expert_linux_amd64" },
	root_dir = function(fname)
		return require("lspconfig").util.root_pattern("mix.exs", ".git")(fname) or vim.loop.cwd()
	end,
	filetypes = { "elixir", "eelixir", "heex" },
	-- optional settings
	settings = {},
}
