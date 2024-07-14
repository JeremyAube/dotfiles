return {
	"nvim-lualine/lualine.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons", opt = true },
	opts = {
		theme = "auto",
		options = {
			section_separators = { left = "", right = "" },
			component_separators = "",
		},
		sections = {
			lualine_a = { "mode" },
			lualine_b = { { "branch", icon = "" }, "diff" },
			lualine_c = { "filename", "diagnostics" },
			lualine_x = {},
			lualine_y = { "filetype" },
			lualine_z = { "encoding" },
		},
	},
}
