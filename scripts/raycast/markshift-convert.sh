#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Convert Clipboard
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📋
# @raycast.packageName Markshift
# @raycast.description Auto-detect clipboard format and convert (rich text ↔ markdown, CSV → table)

markshift convert --paste --copy --quiet
