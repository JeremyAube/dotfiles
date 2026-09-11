# Starship
eval "$(starship init zsh)"

# Mise-en-place
eval "$(/Users/jeremy/.local/bin/mise activate zsh)"

## Configuration
source $HOME/.config/zsh/variables.sh
source $HOME/.config/zsh/alias.sh
source $HOME/.config/zsh/herdr.sh
source $HOME/.config/zsh/pj.sh
source $HOME/.config/zsh/dotnet.sh

# Programs
source <(fzf --zsh)

# Private Vars
[[ -f $HOME/.private.env ]] && source $HOME/.private.env
