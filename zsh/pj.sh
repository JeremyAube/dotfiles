#!/bin/bash
# Utility to fuzzy search over my projects to easily switch between them

pj() {
  local dir
  local files
  dir=$(echo "$(find ~/Developer/perso -maxdepth 1 -type d)\n$(find ~/Developer/mirego -maxdepth 2 -type d)\n$(realpath ~/.zshrc)\n$(realpath ~/.config)" | fzf)

  case "$dir" in 
    *".zshrc"*) vim $dir;;
    *".config"*) vim -c "cd ~/.config" ~/.config;;
    *) cd $dir
  esac
}

