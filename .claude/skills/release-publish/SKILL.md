---
name: release-publish
description: How to tag and publish a new devflow-cli release. Use when the user asks to release, publish, cut a version, or bump the package. Covers the full flow: merge PRs → devflow release → bypass pre-push → create GitHub release. npm publish is fully automated by the publish.yml GitHub Action — never run it manually.
---

# Release & Publish

devflow-cli publishes to npm as `@alejandrochaves/devflow-cli`. Releases live on the `main` branch; there is no separate release branch.

**npm publish is handled automatically** by `.github/workflows/publish.yml`, which triggers on `release: [published]`. Never run `npm publish` manually.

## Pre-flight

1. All intended PRs must be merged to `main` first.
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

Creating the GitHub release is the final manual step. It also triggers the npm publish automatically.

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(sed -n '/^## \[X\.Y\.Z\]/,/^## \[/p' CHANGELOG.md | head -n -1)"
```

Replace `X.Y.Z` with the actual version. The sed command extracts that version's section from CHANGELOG.md.

Once published, the `publish.yml` workflow runs automatically: it type-checks, tests, builds, and publishes to npm with provenance. No further action needed.

## Explicit version override

```bash
devflow release --version 2.0.0 --yes
```

## Summary (quick reference)

```bash
git checkout main && git pull
devflow release --bump minor --yes        # or patch/major/--version X.Y.Z
ALLOW_MAIN_PUSH=1 git push
ALLOW_MAIN_PUSH=1 git push --tags
gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."
# ↑ publishing the GitHub release triggers npm publish automatically
```
