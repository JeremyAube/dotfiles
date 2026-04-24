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
