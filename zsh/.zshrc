eval "$(starship init zsh)"
eval "$(/Users/jeremy/.local/bin/mise activate zsh)"

export VISUAL=nvim
export EDITOR="$VISUAL"

# Alias
alias vi="nvim"
alias vim="nvim"
alias ls="ls -p"

# Custom Commands
export PATH="$HOME/.config/zsh/custom:$PATH"

# Custom functions
source $HOME/.config/zsh/pj.sh

# Plugins
# source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source <(fzf --zsh)

# .NET
export DOTNET_CLI_TELEMETRY_OPTOUT=true
export PATH="/Users/jeremy/.local/share/goi/bin:$PATH"

# Herdr-specific key bindings (herdr does not inject shell integration like Ghostty does)
if [ "${HERDR_ENV:-}" = "1" ]; then
  bindkey -e
  bindkey "^A" beginning-of-line
  bindkey "^E" end-of-line
  bindkey $'\e[1;3D' backward-word
  bindkey $'\e[1;3C' forward-word
fi
