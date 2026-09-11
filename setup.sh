#!/usr/bin/env bash
#
# setup.sh — stow all packages into $HOME
#
# Usage: ./setup.sh [package ...]
#   With no arguments, stows every stow-able package in this repo.
#   Otherwise, only stows the named packages.
#
#   ./setup.sh brew
#     Bootstrap Homebrew: installs brew if missing, links ~/.Brewfile to
#     this repo's brew/.Brewfile (if not already present), and installs
#     everything listed in the Brewfile. Does not require stow.

set -euo pipefail

cd "$(dirname "$0")"

brew_setup() {
  # 1. Install Homebrew if it's not already installed.
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found — installing ..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # The installer may not be on PATH in this shell — locate it.
    for brewbin in \
      /opt/homebrew/bin/brew \
      /usr/local/bin/brew \
      "$HOME/.linuxbrew/bin/brew" \
      /home/linuxbrew/.linuxbrew/bin/brew; do
      if [ -x "$brewbin" ]; then
        eval "$("$brewbin" shellenv)"
        break
      fi
    done

    if ! command -v brew >/dev/null 2>&1; then
      echo "error: Homebrew was installed but could not be found on PATH." >&2
      echo "Open a new shell (so brew is on PATH) and re-run: ./setup.sh brew" >&2
      exit 1
    fi
  else
    echo "Homebrew found at $(command -v brew)"
  fi

  # 2. Link ~/.Brewfile to this repo's copy, unless one already exists.
  #    (This is the same symlink stow would create for the `brew` package,
  #    so stowing later is a no-op / conflict-free.)
  if [ -e "$HOME/.Brewfile" ] || [ -L "$HOME/.Brewfile" ]; then
    echo "~/.Brewfile already exists — leaving it as is."
  else
    echo "Linking ~/.Brewfile -> $(pwd)/brew/.Brewfile"
    ln -s "$(pwd)/brew/.Brewfile" "$HOME/.Brewfile"
  fi

  # 3. Install everything listed in the Brewfile.
  echo "Installing packages from ~/.Brewfile ..."
  brew bundle --global
  echo "Brew setup done."
}

# `brew` subcommand: bootstrap Homebrew + Brewfile packages.
# Runs before the stow check — this path must work even without stow.
if [ "${1:-}" = "brew" ]; then
  brew_setup
  exit 0
fi

# stow is a prerequisite — it is not a stow-able package (chicken-and-egg:
# the `brew` package is itself stowed into place by stow, or linked by
# `./setup.sh brew` before stow is available).
if ! command -v stow >/dev/null 2>&1; then
  echo "error: GNU stow is required but not installed." >&2
  echo >&2
  if [[ "$(uname -s)" == "Darwin" ]]; then
    cat >&2 <<'EOF'
It looks like you are on macOS. This repo keeps a Brewfile (brew/.Brewfile,
stowed to ~/.Brewfile) listing packages to install via Homebrew, including
stow itself. To get set up, run:

  ./setup.sh brew

That installs Homebrew if needed, links the Brewfile, and installs stow
along with the other listed packages. Then re-run this script:

  ./setup.sh
EOF
  else
    cat >&2 <<'EOF'
Install GNU stow with your system package manager, e.g.:
  apt install stow     (Debian/Ubuntu)
  dnf install stow     (Fedora)
  pacman -S stow      (Arch)
Then re-run this script.
EOF
  fi
  exit 1
fi

# Packages whose directory layout mirrors $HOME.
# Note: `font` and `keyboard` are standalone repos (font build / ZMK firmware)
# and are not stowed — see font/iosevka/install.sh and keyboard/totem/.
# `brew` is a normal stow package, but stow itself comes from the Brewfile
# (see the prerequisite check above).
stow_packages=(brew ghostty herdr karabiner mise nvim pi starship zsh)

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
