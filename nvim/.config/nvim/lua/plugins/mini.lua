return {
	"echasnovski/mini.nvim",
	config = function()
		require("mini.comment").setup()
		require("mini.pairs").setup()

		-- ======== SURROUND ========
		vim.keymap.set({ "n", "x" }, "s", "<Nop>")
		require("mini.surround").setup()
	end,
}
