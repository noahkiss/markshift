#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Clean & Paste Rich
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ✨
# @raycast.packageName Markshift
# @raycast.description Clean messy HTML (Excel, web) → paste-ready rich text

markshift convert --paste --copy --quiet --to html
