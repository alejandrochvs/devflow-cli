# devflow-cli LinkedIn Strategy v2 — Executive Summary

---

## The Plan (TL;DR)

**Timeline:** 12 weeks (24 posts)  
**Frequency:** 3x/week weeks 1-2, then 2x/week weeks 3-12  
**Goal:** Build awareness + community for devflow-cli on LinkedIn

---

## What Changed

The original plan is from 2+ months ago. Since then, devflow has evolved:

✅ Added: Issues, Comments, Update commands  
✅ Added: Non-interactive flags (perfect for CI/CD + AI scripts)  
✅ Added: Advanced features (undo, fixup, merge, test-plan)  
✅ Expanded: Monorepo support, shareable configs, branch protection  
✅ Launched: Documentation site (devflow.alejandrochaves.dev)

**New positioning:** Not just "branch + commit + PR tool" → "complete git workflow CLI with AI-friendly automation"

---

## Content Pillars (How Posts Break Down)

| Pillar | % | Purpose |
|--------|---|---------|
| Feature Highlights | 40% | Show what devflow does (issues, comments, fixup, etc.) |
| Educational | 30% | Teach git concepts (conventional commits, merging strategies) |
| Architecture/How-I-Built | 15% | Technical storytelling (plugin system, stack choices) |
| Community/Engagement | 15% | Ask questions, roadmap updates, contributor calls |

---

## Weekly Breakdown

**Week 1:** Launch (repositioned with new features)  
**Week 2:** Core features (advanced ones like fixup, undo, monorepo)  
**Week 3:** Advanced workflows (non-interactive mode, self-update, test plans)  
**Week 4:** Team/enterprise angle (shareable configs, branch protection)  
**Week 5-6:** Educational deep dives + "how I built this"  
**Week 7-9:** Feature highlights + engagement  
**Week 10-12:** Roadmap + community (contributor call, thank you posts)

---

## Post Rules (Every Time)

1. ✅ Link goes in **first comment**, never in post body
2. ✅ Ask a **question at the end** (drives engagement)
3. ✅ Reply to **every comment in first 60 minutes**
4. ✅ One idea per post (don't mix topics)
5. ✅ **3-5 hashtags** (#devtools #git + 3 rotating ones)
6. ✅ **Conversational tone**, first person
7. ✅ Max 3 lines per paragraph, **lots of whitespace**
8. ✅ Include **media** (terminal GIF, screenshot, or code snippet)

---

## Media You'll Need

For each post:
- **Terminal recordings** (45s max) — use `vhs` tool
- **Code snippets** — use ray.so or carbon.now.sh
- **Screenshots** — dark terminal, large font (18px+)

Tools:
- `vhs` for terminal recordings → GIF/MP4
- `ray.so` for code snippets
- Figma/Canva for carousels (optional)

---

## Hashtag Rotation

**Always use:** #devtools #git

**Rotate 3 from these:**
- #opensource
- #cli
- #typescript
- #buildinpublic
- #automation ← NEW (emphasis on scripts/CI)
- #productivity
- #monorepo ← NEW (featured more)
- #codereview
- #conventionalcommits
- #nodejs

---

## Success Metrics

Target by end of 12 weeks:
- 1500+ GitHub stars
- 5000+/month npm downloads
- 5000+ impressions per post
- 50+ reactions/comments per post
- 5+ external contributors

---

## The First Post (Week 1, Day 1)

**Date:** [Your first Tuesday]  
**Topic:** Launch (repositioned)  
**Media:** 30-45s terminal GIF showing full workflow: `devflow branch` → `devflow commit` → `devflow pr` → `devflow comments` → `devflow merge`

**Post Text:**

```
I wrote a CLI that handles the entire git workflow.

Not just the basics:

git checkout -b feat/...
git commit -m "..."
gh pr create ...

But the stuff that usually takes extra steps:

1. Create a branch (auto-formats, prevents main)
2. Stage and commit (conventional format)
3. Open a PR (auto-filled template)
4. View review comments inline (without switching tabs)
5. Merge with one command (squash/rebase/merge your choice)

One tool. Five operations. Zero context switching.

Works solo or in teams.
Supports traditional git or monorepos.
Scriptable for CI/CD (non-interactive flags on everything).

Open source. Type-safe. Zero runtime dependencies beyond commander + inquirer.

Link in comments.

What's the most annoying git step in your workflow?

#git #cli #opensource #devtools #productivity
```

**First Comment:** 
```
GitHub: https://github.com/alejandrochvs/devflow-cli | Docs: https://devflow.alejandrochaves.dev | npm: @alejandrochaves/devflow-cli
```

---

## Next Steps After First Post

1. **Week 1, Day 2:** GitHub Issues Integration post
2. **Week 1, Day 3:** Comments Command post
3. **Week 2 onward:** Follow the calendar

Each post follows the same rules, different topic.

---

## Should You Change Anything?

**Questions to consider:**
- Does the repositioning feel right? (You're emphasizing the automation + AI aspects)
- Are the features in the right order? (Issues → Comments → Advanced workflow)
- Do you want to change the tone or hashtags?
- Should you adjust the posting schedule?
- Any features you want to deprioritize?

Let me know if you want to tweak anything before launching! 🚀
