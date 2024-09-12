return {
	{ "echasnovski/mini.ai", version = false },
	{ "echasnovski/mini.comment", version = false },
	{ "echasnovski/mini.pairs", version = false },
	{
		"echasnovski/mini.surround",
		version = false,
		config = function()
			vim.keymap.set({ "n", "x" }, "s", "<Nop>")
			require("mini.surround").setup()
		end,
	},
}
