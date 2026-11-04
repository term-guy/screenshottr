# Screenshottr

A fast, single-file screenshot annotator that runs entirely in your browser. Paste a screenshot, mark it up with arrows, boxes, text, numbered steps and redactions, then copy or export it. No install, no build step, no uploads.

## Features

- **Paste, drop, or open**: paste with `⌘V` / `Ctrl V`, drag an image onto the window, or start from a blank canvas
- **Infinite canvas**: start an endless canvas from the start screen to arrange screenshots and annotations freely. Paste images into the middle of the view (or drop them where you want them), drag empty space, middle-drag, hold `Space` or scroll with a trackpad to pan, use the mouse wheel or pinch to zoom, and **Fit** (`⌘0`) to see everything. Copy and PNG export cover all objects with a small margin
- **Images are objects**: the screenshot you paste or open, and every image you paste after it, is its own object on the canvas, always at its original 1:1 size. Move, resize (corners keep the aspect ratio; hold `⇧` to stretch), reorder, fade, duplicate, or delete it; the original pixels are kept, so **1:1** returns a resized image to its original size.
- **Crop images**: select an image and press **Crop**, drag the handles to trim it or drag inside to move the crop window, then `Enter` to apply or `Esc` to cancel. The original pixels are kept, so **Reset crop** brings back the whole image `⇧⌘V` starts a new document from the clipboard instead
- **Annotation tools**: arrow, line, rectangle, ellipse, text, and auto-numbered step markers
- **Redaction**: pixelate, blur, or solid-fill sensitive areas
- **Editable objects**: select, move, resize, restyle, and reorder annotations at any time
- **Multiple selection**: `⇧`-click to add or remove objects, `⇧`-drag a box to add everything inside it, or `⌘A` for all. Drag any selected object to move them together; nudge, duplicate, reorder, delete, and copy work on the whole selection
- **Text styling**: font, size, left / center / right alignment, outline, background, padding, and corner radius; drag a text box's handle to set its width and the text word-wraps at the same font size
- **Precise values**: every slider (font size, opacity, weight…) has a box you can type a value into
- **Canvas resize and background**: crop or extend the canvas with drag handles and anchor control; pick the canvas background colour (or transparent) from the Properties panel whenever nothing is selected
- **Copy / paste objects between instances**: `⌘C` copies the selected objects (annotations, text with its style, images with their pixels, crop and size); `⌘V` pastes it in any Screenshottr tab, window or browser, centred in the view. Other apps get the plain text or the image
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
| Copy selected objects | `⌘C` |
| Add / remove object from selection | `⇧`-click |
| Add objects inside a box to selection | `⇧`-drag |
| Select all | `⌘A` |
| Paste annotation, or an image as a new object | `⌘V` |
| Paste an image as a new document | `⇧⌘V` |
| Copy image to clipboard (nothing selected) | `⌘C` |
| Export PNG | `⌘S` |
| Save `.sshot` project | `⇧⌘S` |
| Undo / Redo | `⌘Z` / `⇧⌘Z` |
| Zoom in / out | `⌘+` / `⌘−` |
| Zoom at pointer | Mouse wheel (10% steps) or trackpad pinch |
| Pan | Middle-click and drag (infinite canvas: also drag empty space, `Space`+drag, or trackpad scroll) |
| Actual size (100%) | `⌘1` |
| Fit to window | `⌘0` |
| Set exact zoom | Click the zoom %, type a value, `Enter` |
| Delete selection | `Delete` / `Backspace` |
| Deselect | `Esc`, or click outside the canvas |
| Send backward / bring forward | `[` / `]` |
| Nudge selection (×10 with `⇧`) | Arrow keys |
| Constrain angle / proportions | Hold `⇧` while drawing |

On Windows and Linux, use `Ctrl` in place of `⌘`.

## License

[MIT](LICENSE)
