#!/usr/bin/env bash
set -euo pipefail

npm run build

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

cp -a dist/. "$tmpdir/"
touch "$tmpdir/.nojekyll"

git -C "$tmpdir" init -b gh-pages
git -C "$tmpdir" config user.name "KonduktoR13"
git -C "$tmpdir" config user.email "konduktor13@users.noreply.github.com"
git -C "$tmpdir" add .
git -C "$tmpdir" commit -m "Deploy GitHub Pages"
git -C "$tmpdir" remote add origin git@github.com:KonduktoR13/fitpwa.git
git -C "$tmpdir" push origin gh-pages --force
