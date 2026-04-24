#!/bin/bash

brew list ttfautohint &>/dev/null || brew install ttfautohint

if [ -d "Iosevka" ]; then
  echo "-- Repository already exists, pulling latest changes --"
  git -C Iosevka checkout main
  git -C Iosevka pull
else
  echo "-- Repository doesn't exists, cloning it --"
  git clone --depth 1 git@github.com:be5invis/Iosevka.git Iosevka
fi

cp private-build-plans.toml Iosevka/private-build-plans.toml

(cd Iosevka && npm install)

echo "--- Building the TTF font ---"
(cd Iosevka && npm run build -- ttf-unhinted::IosevkaCustom)

echo "--- Build complete, patching with Nerd Font ---"
docker run --rm -v ./Iosevka/dist/IosevkaCustom/TTF-Unhinted:/in:Z -v ./Iosevka/dist/IosevkaCustom/TTF-NERD:/out:Z -e "PN=10" nerdfonts/patcher 

echo "--- Installing the fonts on the system ---"
mv ./Iosevka/dist/IosevkaCustom/TTF-NERD/*.ttf ~/Library/Fonts
