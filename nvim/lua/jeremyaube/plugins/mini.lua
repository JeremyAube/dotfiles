return {
	"echasnovski/mini.nvim",
	config = function()
		require("mini.ai").setup()
		require("mini.comment").setup()
		require("mini.pairs").setup()
		require("mini.tabline").setup({
			show_icons = true,
		})

		-- ======== FILES ========
		local mini_files = require("mini.files")
		mini_files.setup({
			windows = {
				max_number = 3,
				preview = true,
			},
		})
		vim.keymap.set("n", "-", function()
			mini_files.open(vim.api.nvim_buf_get_name(0))
		end)

		-- ======== SURROUND ========
		vim.keymap.set({ "n", "x" }, "s", "<Nop>")
		require("mini.surround").setup()
	end,
}
