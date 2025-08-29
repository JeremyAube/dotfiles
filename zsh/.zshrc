eval "$(starship init zsh)"

export VISUAL=nvim
export EDITOR="$VISUAL"

# Alias
alias vi="nvim"
alias vim="nvim"

# Custom Commands
source ~/.config/zsh/pj.sh
source ~/.config/zsh/ai.sh

# Android
export ANDROID_HOME=/Users/$USER/Library/Android/sdk
export PATH=${PATH}:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Bun (Javascript)
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
[ -s "/Users/jeremy/.bun/_bun" ] && source "/Users/jeremy/.bun/_bun" # Completions

# Plugins
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source <(fzf --zsh)
eval "$(/Users/jeremy/.local/bin/mise activate zsh)"

# .NET
export DOTNET_CLI_TELEMETRY_OPTOUT=true
