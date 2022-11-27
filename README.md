# History Timelines
Generate a chronological timeline of all notes in chronological (or reversed) order. 
This is a fork of [Darakah's Timelines](https://github.com/Darakah/obsidian-timelines) plugin

## Syntax
```yaml
\```timeline
// This notation is in YAML
date: 2022-11-26

// Optional
end: 2023 // Makes this event a range
color: yellow // accepts HTML color codes (some are modified for better viewing) and hex colors
image: image.png // Adds an image into the timeline, can be automaticaly fetched when using the Banner plugin
title: Example title // Custom title, the note name is used when not provided

\```
```

TODO:
- Mode + Reverse Toggle
- Better css
- Better representation format - codeblock that can be parsed but also looks nice in the editor
- Read banner image from [banner plugin] if none provided

## Licence

Licenced under the [MIT License](https://mit-license.org/).
