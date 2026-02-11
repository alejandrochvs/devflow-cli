# Release Workflow

This guide explains how to release a new version of the project.

## The Automated Way (`devflow release`)

The `devflow release` command attempts to automate the entire process:

1. analyzes commits since the last tag to suggest a version bump (major/minor/patch)
2. updates `package.json` version
3. updates `CHANGELOG.md` with generated notes
4. creates a release commit and tag
5. pushes changes and tags to remote
6. creates a GitHub Release (which triggers the publish workflow)

```bash
devflow release
```

### ⚠️ Handling Branch Protection

If your repository has branch protection on `main` that blocks direct pushes, `devflow release` will fail at the **push** step. In this case, you should follow the Pull Request workflow below.

## The Pull Request Workflow (Recommended)

To release via PR (bypassing direct push restrictions):

### 1. Create a Release Branch

Create a branch for the release chores:

```bash
devflow branch --type chore --description "release-v1.6.1"
```

### 2. Prepare Release Files

Manually update the version and changelog. You can use `devflow release --dry-run` to generate the changelog content for you to copy-paste.

**Update `package.json`:**

```json
{
  "version": "1.6.1"
}
```

**Update `CHANGELOG.md`:**
Add the new version header and notes at the top.

### 3. Commit and PR

```bash
git add package.json CHANGELOG.md
devflow commit -m "release v1.6.1"
devflow pr --title "chore: release v1.6.1"
```

### 4. Merge and Tag

Once the PR is merged:

1. **Pull the latest main:**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Tag the release:**

   ```bash
   git tag v1.6.1
   git push origin v1.6.1
   ```

3. **Create GitHub Release:**
   This triggers the npm publish workflow.
   ```bash
   gh release create v1.6.1 --generate-notes
   ```

## Troubleshooting

If you are stuck (e.g., tag exists but release doesn't):

- **Push the tag:** `git push origin v1.6.1`
- **Create release from existing tag:** `gh release create v1.6.1 --generate-notes`
