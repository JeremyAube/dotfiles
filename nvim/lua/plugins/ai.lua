return {
	{
		"github/copilot.vim",
		config = function()
			vim.g.copilot_no_tab_map = true
			vim.keymap.set("i", "<C-ENTER>", 'copilot#Accept("\\<CR>")', {
				expr = true,
				replace_keycodes = false,
			})
		end,
	},
	{
		"folke/sidekick.nvim",
		opts = {
			cli = {
				tools = {
					claude = { cmd = { "ai" }, url = "https://github.com/anthropics/claude-code" },
				},
			},
		},
		config = function(_, opts)
			require("sidekick").setup(opts)

			vim.keymap.set({ "n", "i", "x", "t" }, "<c-;>", function()
				require("sidekick").nes_jump_or_apply()
			end, { expr = true, desc = "Goto/Apply Next Edit Suggestion" })

			vim.keymap.set({ "n", "x", "i", "t" }, "<c-.>", function()
				require("sidekick.cli").toggle({ name = "claude", focus = true })
			end, { desc = "Sidekick Toggle" })

			vim.keymap.set({ "n", "v" }, "<leader>ia", function()
				require("sidekick.cli").select_prompt()
			end, { desc = "Sidekick Ask Prompt" })
		end,
	},
}
