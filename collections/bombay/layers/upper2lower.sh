#!/bin/bash
echo "🔄 Renaming files to lowercase (macOS-compatible)..."

find . -depth | while read file; do
    lowercase=$(echo "$file" | tr '[:upper:]' '[:lower:]')

    if [[ "$file" != "$lowercase" ]]; then
        # Step 1: Rename to a temporary name first
        tempname="${lowercase}_tmp"
        mv "$file" "$tempname"

        # Step 2: Rename it again to the final lowercase name
        mv "$tempname" "$lowercase"

        echo "✅ Renamed: $file → $lowercase"
    fi
done

echo "🎉 All filenames are now lowercase!"