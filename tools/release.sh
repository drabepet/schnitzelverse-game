#!/usr/bin/env bash
# Publish a release: copy the private repo's committed main (no history) into
# the public repo as one commit "Release v<version>", tag it and push. The
# public repo's Pages workflow then builds and publishes the game.
#
# Only run this when a release is wanted. Bump src/version.ts first.
#
#   tools/release.sh            # release the version in src/version.ts
#   RELEASE_DIR=../somewhere tools/release.sh
set -euo pipefail

PUBLIC_REPO="drabepet/schnitzelverse-game"
# Public commits use GitHub's no-reply address, so no private e-mail goes public.
PUBLIC_NAME="drabepet"
PUBLIC_EMAIL="103991105+drabepet@users.noreply.github.com"

cd "$(git rev-parse --show-toplevel)"
RELEASE_DIR="${RELEASE_DIR:-../schnitzelverse-public}"
VERSION="$(sed -n "s/.*GAME_VERSION = '\(.*\)'.*/\1/p" src/version.ts)"
[ -n "$VERSION" ] || { echo "No GAME_VERSION in src/version.ts" >&2; exit 1; }
TAG="v$VERSION"

# 1. Only release what is committed and pushed on main.
[ "$(git branch --show-current)" = "main" ] || { echo "Release from main only" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commit your changes first" >&2; exit 1; }
git fetch -q origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "Push main first" >&2; exit 1; }
SOURCE_COMMIT="$(git rev-parse --short HEAD)"

# 2. It must build and pass the tests.
npm test
npm run build

# 3. Get the public repo.
if [ -d "$RELEASE_DIR/.git" ]; then
  git -C "$RELEASE_DIR" pull -q --ff-only || true
else
  gh repo clone "$PUBLIC_REPO" "$RELEASE_DIR"
fi
if git -C "$RELEASE_DIR" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "$TAG is already released; bump src/version.ts" >&2
  exit 1
fi

# 4. Replace its files with this commit's files (history stays private).
STAGE="$(mktemp -d)"
git archive HEAD | tar -x -C "$STAGE"
rsync -a --delete --exclude .git "$STAGE"/ "$RELEASE_DIR"/
rm -rf "$STAGE"

# 5. One commit and a tag per release.
cd "$RELEASE_DIR"
git checkout -q -B main
git add -A
git -c user.name="$PUBLIC_NAME" -c user.email="$PUBLIC_EMAIL" commit -q -m "Release $TAG" -m "Schnitzelverse $VERSION." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git -c user.name="$PUBLIC_NAME" -c user.email="$PUBLIC_EMAIL" tag -a "$TAG" -m "Schnitzelverse $VERSION"
git push -q -u origin main
git push -q origin "$TAG"
echo "Released $TAG (from $SOURCE_COMMIT) to https://github.com/$PUBLIC_REPO"
echo "Game: https://drabepet.github.io/schnitzelverse-game/ (after the Pages workflow finishes)"
