# Screenshottr

A fast, single-file screenshot annotator that runs entirely in your browser. Paste a screenshot, mark it up with arrows, boxes, text, numbered steps and redactions, then copy or export it. No install, no build step, no uploads.

## Features

- **Paste, drop, or open**: paste with `⌘V` / `Ctrl V`, drag an image onto the window, or start from a blank canvas
- **Annotation tools**: arrow, line, rectangle, ellipse, text, and auto-numbered step markers
- **Redaction**: pixelate, blur, or solid-fill sensitive areas
- **Editable objects**: select, move, resize, restyle, and reorder annotations at any time
- **Text styling**: font, size, outline, background, padding, and corner radius; drag a text box's handle to set its width and the text word-wraps at the same font size
- **Precise values**: every slider (font size, opacity, weight…) has a box you can type a value into
- **Canvas resize**: crop or extend the canvas with drag handles and anchor control
- **Copy / paste annotations**: `⌘C` copies the selected annotation with its text, color and style; `⌘V` pastes it (also across tabs)
- **Zoom**: type an exact zoom level, jump to 1:1, or fit to window
- **Undo / redo** with full history
- **Export**: copy to clipboard, save as PNG, or save an editable `.sshot` project file
- **Recent images**: a local library of past work, stored in your browser (IndexedDB)
- **Private by design**: everything stays on your machine

## Getting started

Open `index.html` in a modern browser. That's it.

To serve it locally instead (clipboard access works more reliably over `http://localhost`):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

It can also be hosted as-is on any static host, such as GitHub Pages.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Select / move | `V` |
| Arrow | `A` |
| Line | `L` |
| Rectangle | `R` |
| Ellipse | `E` |
| Text | `T` |
| Numbered step | `N` |
| Redact | `P` |
| Resize canvas | `C` |
| Open image or project | `⌘O` |
| Copy selected annotation | `⌘C` |
| Paste annotation | `⌘V` |
| Copy image to clipboard (nothing selected) | `⌘C` |
| Export PNG | `⌘S` |
| Save `.sshot` project | `⇧⌘S` |
| Undo / Redo | `⌘Z` / `⇧⌘Z` |
| Zoom in / out | `⌘+` / `⌘−` |
| Actual size (100%) | `⌘1` |
| Fit to window | `⌘0` |
| Set exact zoom | Click the zoom %, type a value, `Enter` |
| Delete selection | `Delete` / `Backspace` |
| Send backward / bring forward | `[` / `]` |
| Nudge selection (×10 with `⇧`) | Arrow keys |
| Constrain angle / proportions | Hold `⇧` while drawing |

On Windows and Linux, use `Ctrl` in place of `⌘`.

## License

[MIT](LICENSE)
