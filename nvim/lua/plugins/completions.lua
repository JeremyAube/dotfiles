return {
	"saghen/blink.cmp",
	dependencies = {
		"rafamadriz/friendly-snippets",
		"Kaiser-Yang/blink-cmp-avante",
	},
	version = "*",
	opts = {
		keymap = { preset = "default" },
		appearance = {
			-- Sets the fallback highlight groups to nvim-cmp's highlight groups
			-- Useful for when your theme doesn't support blink.cmp
			-- Will be removed in a future release
			use_nvim_cmp_as_default = true,
			-- Set to 'mono' for 'Nerd Font Mono' or 'normal' for 'Nerd Font'
			-- Adjusts spacing to ensure icons are aligned
			nerd_font_variant = "mono",
		},

		signature = { enabled = true },

		sources = {
			default = { "lsp", "path", "snippets", "buffer", "avante" },
			providers = {
				avante = {
					module = "blink-cmp-avante",
					name = "Avante",
				},
			},
		},
	},
	opts_extend = { "sources.default" },
}
