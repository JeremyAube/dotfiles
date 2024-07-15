-- Pull in the wezterm API
local wezterm = require("wezterm")

-- This will hold the configuration.
local config = wezterm.config_builder()

-- This is where you actually apply your config choices

-- For example, changing the color scheme:
config.color_scheme = "Tokyo Night Moon"
config.font = wezterm.font("Iosevka Nerd Font")
config.font_size = 20
config.enable_tab_bar = false
config.window_decorations = "RESIZE"

-- and finally, return the configuration to wezterm
return config
