#!/bin/bash
# Generate simple placeholder icons using ImageMagick (if available) or just create a placeholder
if command -v convert &> /dev/null; then
  convert -size 192x192 xc:'#1e3a5f' -fill white -gravity center -pointsize 72 -annotate 0 'BR' icon-192.png
  convert -size 512x512 xc:'#1e3a5f' -fill white -gravity center -pointsize 180 -annotate 0 'BR' icon-512.png
else
  echo "ImageMagick not found, creating simple placeholder..."
  # Create a simple 1x1 pixel PNG and note for manual replacement
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > icon-192.png
  cp icon-192.png icon-512.png
  echo "Placeholder icons created. Replace with actual icons later."
fi
