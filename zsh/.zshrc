eval "$(starship init zsh)"

# Alias
alias vi="nvim"
alias vim="nvim"
alias lg="lazygit"

source ~/.config/zsh/pj.sh
source ~/.config/zsh/ai.sh
export VISUAL=nvim
export EDITOR="$VISUAL"

# Android
export ANDROID_HOME=/Users/$USER/Library/Android/sdk
export PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# plugins
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

source <(fzf --zsh)
eval "$(/Users/jeremy/.local/bin/mise activate zsh)"
# export PATH="${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH"

export PATH="/Users/jeremy/.lando/bin:$PATH"; #landopath
export DOTNET_CLI_TELEMETRY_OPTOUT=true

# opencode
export PATH=/Users/jeremy/.opencode/bin:$PATH

# bun completions
[ -s "/Users/jeremy/.bun/_bun" ] && source "/Users/jeremy/.bun/_bun"
