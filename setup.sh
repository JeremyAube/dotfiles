#!/usr/bin/env bash
#
# setup.sh — stow all packages into $HOME
#
# Usage: ./setup.sh [package ...]
#   With no arguments, stows every stow-able package in this repo.
#   Otherwise, only stows the named packages.

set -euo pipefail

cd "$(dirname "$0")"

# Packages whose directory layout mirrors $HOME.
# Note: `font` and `keyboard` are standalone repos (font build / ZMK firmware)
# and are not stowed — see font/iosevka/install.sh and keyboard/totem/.
stow_packages=(ghostty herdr karabiner mise nvim pi starship zsh)

if [ $# -gt 0 ]; then
  packages=("$@")
else
  packages=("${stow_packages[@]}")
fi

for pkg in "${packages[@]}"; do
  if [ ! -d "$pkg" ]; then
    echo "error: no such package: $pkg" >&2
    exit 1
  fi
done

echo "Stowing ${packages[*]} into $HOME ..."
stow --target ~ "${packages[@]}"
echo "Done."
