# Herdr-specific key bindings (herdr does not inject shell integration like Ghostty does)
if [ "${HERDR_ENV:-}" = "1" ]; then
  bindkey -e
  bindkey "^A" beginning-of-line
  bindkey "^E" end-of-line
  bindkey $'\e[1;3D' backward-word
  bindkey $'\e[1;3C' forward-word
fi
