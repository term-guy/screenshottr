# Screenshottr

A fast, single-file screenshot annotator that runs entirely in your browser. Paste a screenshot, mark it up with arrows, boxes, text, numbered steps and redactions, then copy or export it. No install, no build step, no uploads.

## Features

- **Paste, drop, or open**: paste with `⌘V` / `Ctrl V`, drag an image onto the window, or start from a blank canvas
- **Infinite canvas**: start an endless canvas from the start screen to arrange screenshots and annotations freely. Paste images into the middle of the view (or drop them where you want them), drag empty space, middle-drag, hold `Space` or scroll (mouse wheel or trackpad, `⇧` for sideways) to pan, use `Ctrl` + mouse wheel or pinch to zoom, and **Fit** (`⌘0`) to see everything. Copy and PNG export cover all objects with a small margin. **Convert to infinite canvas** / **Convert to regular canvas** in the Properties panel (with nothing selected) switches an open document either way; going to regular sizes the canvas to fit all objects with that same margin, and going to infinite removes the canvas edges, so anything cropped off by them becomes visible again
- **Images are objects**: the screenshot you paste or open, and every image you paste after it, is its own object on the canvas, always at its original 1:1 size. Move, resize (corners keep the aspect ratio; hold `⇧` to stretch), reorder, fade, duplicate, or delete it; the original pixels are kept, so **1:1** returns a resized image to its original size.
- **Crop images**: select an image and press **Crop**, drag the handles to trim it or drag inside to move the crop window, then `Enter` to apply or `Esc` to cancel. The original pixels are kept, so **Reset crop** brings back the whole image `⇧⌘V` starts a new document from the clipboard instead
- **Annotation tools**: arrow, line, rectangle, ellipse, text, pen, highlighter, and auto-numbered step markers
- **Pen and highlighter**: draw freehand strokes; the tool stays on so you can keep drawing, and `⇧` draws a straight segment. The highlighter blends with what's below so text under it stays readable, on light and dark backgrounds alike (it picks the blend from where the stroke starts; switch it under **Background** in the panel)
- **Snap guides**: while moving, objects snap their edges and centres to other objects and to the canvas, with a guide line; hold `⌥` / `Alt` to move freely
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
- **New document**: the **New** menu in the toolbar (and in the Recent popup) starts a blank canvas, an infinite canvas, or opens a file
- **Recent images**: a scrollable local library of past work, stored in your browser (IndexedDB); removing an entry asks for confirmation
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
| Pen | `D` |
| Highlighter | `H` |
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
| Zoom at pointer | `Ctrl` + mouse wheel (10% steps) or trackpad pinch |
| Scroll / pan | Mouse wheel or trackpad scroll (`⇧` + wheel scrolls sideways), or middle-click and drag (infinite canvas: also drag empty space or `Space`+drag) |
| Actual size (100%) | `⌘1` |
| Fit to window | `⌘0` |
| Set exact zoom | Click the zoom %, type a value, `Enter` |
| Delete selection | `Delete` / `Backspace` |
| Deselect | `Esc`, or click outside the canvas |
| Send backward / bring forward | `[` / `]` |
| Nudge selection (×10 with `⇧`) | Arrow keys |
| Constrain angle / proportions | Hold `⇧` while drawing |
| Move without snapping | Hold `⌥` / `Alt` while dragging |

On Windows and Linux, use `Ctrl` in place of `⌘`.

## Tests

Browser tests live in `tests/` and use [Playwright](https://playwright.dev). The app itself still has no dependencies or build step.

```sh
cd tests
npm install
npx playwright install chromium   # once
npm test
```

They serve the repo with `python3 -m http.server` and cover copy and paste between tabs, multiple selection, snapping, the pen and highlighter, and the Recent popup. Set `CHROMIUM_PATH` to run them with a Chromium you already have.

## License

[MIT](LICENSE)
