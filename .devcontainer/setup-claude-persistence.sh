#!/usr/bin/env bash
# Runs once per container create. Fixes two Claude Code + devcontainer
# persistence gotchas — see the comments below — then does normal setup.
set -euo pipefail

CLAUDE_DIR="/home/node/.claude"
JSON_VOLUME_DIR="/home/node/.claude-json-data"
JSON_LINK="/home/node/.claude.json"

# 1. Fresh named volumes are created owned by root. Docker only preserves
#    ownership on first mount if the image already had a populated
#    directory there for it to copy from — an empty mount point doesn't
#    count. Without this, `claude login` can report success while the
#    actual write to disk silently fails as the non-root `node` user.
sudo chown -R "$(id -u):$(id -g)" "$CLAUDE_DIR" "$JSON_VOLUME_DIR"

# 2. Claude Code's account/session state lives in ~/.claude.json, which
#    sits directly at $HOME — NOT inside ~/.claude/ — so mounting a volume
#    onto ~/.claude/ alone never captures it. Volumes only mount
#    directories, so instead we mount a small directory and symlink the
#    single file into it.
if [ ! -e "${JSON_VOLUME_DIR}/.claude.json" ]; then
  touch "${JSON_VOLUME_DIR}/.claude.json"
fi
if [ ! -L "$JSON_LINK" ]; then
  rm -f "$JSON_LINK"
  ln -s "${JSON_VOLUME_DIR}/.claude.json" "$JSON_LINK"
fi

npm install