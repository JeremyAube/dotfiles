-- Pull in the wezterm API
local wezterm = require("wezterm")
local config = wezterm.config_builder()


config.font = wezterm.font({
	family = "IosevkaCustom Nerd Font",
	weight = "Medium",
})

config.font_size = 18

config.enable_tab_bar = false
config.send_composed_key_when_left_alt_is_pressed = true
config.send_composed_key_when_right_alt_is_pressed = false

return config
