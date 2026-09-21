# Template releases

Keep two separate folders:

- **Personal brain:** daily notes, decisions, private sources, and local map configuration.
- **Template development:** a fresh clone of the public repository containing starter content and reusable code. Do not run personal setup here.

Use the template checkout for release branches and pull requests. A private backup of a personal brain belongs in a separate private destination, never the public template.

## Release reusable improvements

1. Start a branch from the latest public default branch in the template checkout.
2. Copy an explicit list of reusable files from the personal brain. Do not copy the entire repository, Git history, or map directory.
3. For the 3D map, the reusable files are:

   ```text
   apps/knowledge-map/app.js
   apps/knowledge-map/index.html
   apps/knowledge-map/styles.css
   apps/knowledge-map/scene.js
   apps/knowledge-map/scene.test.mjs
   apps/knowledge-map/markdown.js
   apps/knowledge-map/vendor/marked.js
   apps/knowledge-map/vendor/marked.LICENSE.md
   apps/knowledge-map/README.md
   ```

4. Edit shared documentation in the clean checkout. Author skill updates in `.claude/skills/`, then run `node scripts/sync-skills.mjs` to regenerate the Codex copies.
5. Run the geometry tests, build the map using starter notes, and check the browser:

   ```bash
   node --test apps/knowledge-map/scene.test.mjs
   node scripts/build-map.mjs
   node scripts/serve-map.mjs
   ```

   Verify orbit, zoom, search, filters, note reading, and cinema. Check Formatted / Markdown switching and preference persistence. Verify link navigation using synthetic notes with resolvable links; a starter map may legitimately have no links. Test that embedded HTML and unsafe URLs remain inert, and that images do not fetch remote resources. Keep temporary test notes outside the release.
6. Stage only the intended code and documentation paths. Review both `git diff --cached --name-status` and `git diff --cached`. Confirm starter notes and shared configuration are unchanged; no generated data, local configurations, credentials, personal paths, or private content belong in this release.
7. Commit on the release branch, push it, and open a pull request. Review before merging. New installations get the upgraded template after it reaches the default branch.

## What stays private

`captures/`, `reviews/`, `apps/knowledge-map/data/graph.json`, and `apps/knowledge-map/map.config.local.json` are ignored by default. Do not force-add them.

`workspace/`, `journal/`, and `workflows/` are tracked. Personal edits there are not protected by `.gitignore`. Other tracked Markdown, including `SYSTEM.md`, can also acquire personal content. Review file contents, not just filenames.

Changing `.gitignore` does not remove tracked files or erase existing Git history. Keep public releases in the clean checkout rather than relying on ignore rules to separate personalized content.

## Existing customers: update the map without replacing notes

This release changes the map UI; it does not migrate or reorganize user data.

1. Back up the existing brain to a private location, including untracked and ignored files. A Git commit alone does not back up ignored captures or generated files.
2. Download or clone the updated public template into a separate folder after the release is merged.
3. Compare any local map customizations, then copy only the map files listed above into the existing brain, including the bundled parser and its license. Resolve customized code deliberately rather than replacing it blindly.
4. Update the knowledge-map skill files in `.claude/skills/knowledge-map/` and `.agents/skills/knowledge-map/` after checking for local skill changes.
5. Keep the existing shared/local map configuration and all personal notes. Rebuild the map and refresh the browser.

Do not replace the whole personal repository or use a hard reset to obtain this UI update. A future data-layout migration should be a separate change with a backup and migration plan.
