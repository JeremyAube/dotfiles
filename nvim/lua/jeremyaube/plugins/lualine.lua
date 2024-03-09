return {
	"nvim-lualine/lualine.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons", opt = true },
	opts = {
		theme = "auto",
		options = {
			section_separators = { left = "", right = "" },
			component_separators = "",
		},
		sections = {
			lualine_a = { { "mode", separator = { left = "", right = "" }, right_padding = 2 } },
			lualine_b = { "branch", "diff" },
			lualine_c = { "filename", "diagnostics" },
			lualine_x = {},
			lualine_y = { "filetype" },
			lualine_z = { { "encoding", separator = { left = "", right = "" }, left_padding = 2 } },
		},
	},
}
