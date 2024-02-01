return {
	"nvim-lualine/lualine.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons", opt = true },
	opts = {
		theme = "auto",
		options = {
			section_separators = { left = "", right = "" },
			component_separators = { left = "|", right = "" },
		},
		sections = {
			lualine_a = { "mode" },
			lualine_b = { "branch", "diff" },
			lualine_c = { "filename", "diagnostics" },
			lualine_x = { "filetype" },
			lualine_y = { "encoding" },
			lualine_z = { "datetime" },
		},
	},
}
