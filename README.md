# dotfiles

My personal configuration files, managed with [GNU Stow](https://www.gnu.org/software/stow/).

## Packages

| Package     | Contents                                        |
| ----------- | ----------------------------------------------- |
| `ghostty`   | Ghostty terminal config                         |
| `herdr`     | herdr config                                    |
| `karabiner` | Karabiner-Elements config (keyboard remapping)  |
| `mise`      | mise tool versions & settings                   |
| `nvim`      | Neovim config                                   |
| `pi`        | pi coding agent config                          |
| `starship`  | Starship prompt config                          |
| `zsh`       | Zsh config                                      |

Two directories are kept here but are **not** stow packages (they're standalone
projects that don't map onto `$HOME`):

- `font/` — custom [Iosevka](https://github.com/be5invis/Iosevka) font build
  (run `font/iosevka/install.sh` to build and install)
- `keyboard/` — ZMK firmware for the totem keyboard

## Setup

Requires [GNU Stow](https://www.gnu.org/software/stow/) (e.g. `brew install stow`).

To stow everything:

```sh
./setup.sh
```

Or just a subset:

```sh
./setup.sh nvim zsh
```

Each package directory mirrors the layout of `$HOME`, so stowing creates the
appropriate symlinks (e.g. `ghostty/.config/ghostty` → `~/.config/ghostty`).

