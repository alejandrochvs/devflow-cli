# DevFlow CLI Demos

Terminal recordings for all devflow commands using [VHS](https://github.com/charmbracelet/vhs).

## Prerequisites

Install VHS:
```bash
# macOS
brew install charmbracelet/tap/vhs

# Linux
curl -fsSL https://apt.fury.io/charm/gpg.key | sudo apt-key add -
echo "deb https://apt.fury.io/charm/ * *" | sudo tee /etc/apt/sources.list.d/charm.list
sudo apt update && sudo apt install vhs
```

## Generate a Demo

```bash
# Single demo
vhs demos/core/branch.tape

# All demos
npm run demo:generate
```

## Directory Structure

```
demos/
  core/       # branch, commit, amend, undo, fixup, merge, log
  pr/         # pr, review, comments
  issues/     # issue, issues, test-plan
  stash/      # stash, worktree
  release/    # release, changelog, cleanup, stats
  setup/      # init, doctor, status, lint-config, completions, update
  workflows/  # End-to-end workflow demos
```

## Demo Coverage

Run `npm run demo:coverage` to see which commands have demos.
