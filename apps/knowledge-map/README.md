# Local Knowledge Map

A zero-dependency, local 3D explorer for Markdown and text files. Real world-space coordinates rotate around two axes and use perspective projection, depth ordering, and lighting, rendered with the browser's Canvas API. No external services, fonts, or network calls are needed.

## Explore

- Drag the globe to orbit it; release to coast. Scroll or use **+ / −** to zoom. Touch supports dragging and pinch zoom.
- **Auto-rotate** starts a slow orbit; dragging or opening a note pauses it.
- **Cinema** expands the scene. Click **Exit cinema** or press Escape to return.
- **Reset view** restores the initial orientation and zoom. With the graph focused, arrow keys rotate, + / − zoom, and R resets.
- Search titles, paths, and excerpts. Press `/` to focus search. Source checkboxes filter the scene; **Show all labels** reveals every visible note's label.
- Click a sphere to read its note and follow **Connected notes**. **Browse notes** offers the same selection with keyboard-accessible buttons. On narrow screens, open **Sources** to reach filters and the note list.

Sphere colors identify sources. Straight lines represent resolved explicit Markdown or wiki links; the faint curved globe and orbit guides are decorative. Counts always reflect indexed files, including empty categories. A small knowledge base produces a spacious map rather than invented nodes. The note reader displays plain source text safely.

Animation is off initially. Reduced-motion preferences disable drag inertia; auto-rotation remains available when explicitly started. Rendering pauses in background tabs and stops when the scene is idle.

## Configure

Edit `map.config.json` for shared defaults, or create `map.config.local.json` for user-specific paths. Paths are resolved relative to the repository root. Adding a source or changing note content requires rebuilding the index.

## Build and serve

From the repository root:

```bash
node scripts/build-map.mjs
node scripts/serve-map.mjs
```

Open **http://127.0.0.1:4747**. The server binds only to localhost. Generated `data/graph.json` may contain private note content and is gitignored. Building reads source notes without modifying them.

## Verify geometry

```bash
node --test apps/knowledge-map/scene.test.mjs
```

Browser verification should cover dragging, zoom, auto-rotation, node picking, linked-note navigation, search, source filters, empty results, cinema, and narrow-screen navigation.
