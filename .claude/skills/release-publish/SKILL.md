---
name: release-publish
description: How to tag and publish a new devflow-cli release. Use when the user asks to release, publish, cut a version, or bump the package. Covers the full flow: merge PRs → devflow release → bypass pre-push → create GitHub release.
---

# Release & Publish

devflow-cli publishes to npm as `@alejandrochaves/devflow-cli`. Releases live on the `main` branch; there is no separate release branch.

## Pre-flight

1. All intended PRs must be merged to `main` first — releases capture `main` as-is.
2. Be on `main` and fully up to date:
   ```bash
   git checkout main && git pull
   ```

## Run the release

```bash
devflow release --bump <patch|minor|major> --yes
```

This single command:
- Bumps `package.json` version
- Updates `CHANGELOG.md` with grouped conventional commits since the last tag
- Creates a release commit (`chore[UNTRACKED](core): release vX.Y.Z`)
- Creates the git tag `vX.Y.Z`
- Tries to push — but the Husky pre-push hook blocks direct pushes to `main`

## Push past the pre-push hook

The hook exposes `ALLOW_MAIN_PUSH=1` for release use:

```bash
ALLOW_MAIN_PUSH=1 git push
ALLOW_MAIN_PUSH=1 git push --tags
```

Both are required: the first pushes the release commit, the second pushes the tag.

## Create the GitHub release

After the tag is on remote, create the GitHub release from the CHANGELOG entry:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/^## \[X\.Y\.Z\]/,/^## \[/p' CHANGELOG.md | head -n -1)"
```

Replace `X.Y.Z` with the actual version. The sed command extracts that version's section from CHANGELOG.md.

## npm publish

`prepublishOnly` runs `npm run build` automatically. Publish with:

```bash
npm publish --access public
```

Requires being logged in to npm as the package owner (`npm whoami`).

## Explicit version override

If you need to set an exact version instead of a bump type:

```bash
devflow release --version 2.0.0 --yes
```

## Summary (quick reference)

```bash
git checkout main && git pull
devflow release --bump minor --yes      # or patch/major/--version X.Y.Z
ALLOW_MAIN_PUSH=1 git push
ALLOW_MAIN_PUSH=1 git push --tags
gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."
npm publish --access public
```
