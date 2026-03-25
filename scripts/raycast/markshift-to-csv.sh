#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Table to CSV
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📊
# @raycast.packageName Markshift
# @raycast.description Convert markdown table in clipboard to CSV

markshift convert --paste --copy --quiet --to csv
