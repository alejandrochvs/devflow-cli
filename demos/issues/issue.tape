# VHS Tape for devflow issue
# Creates a GitHub issue with type-specific templates
# Run with: vhs demos/issues/issue.tape

Output demos/issues/issue.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow issue"
Enter
Sleep 3s

# Select issue type: task (index 2 in SCRUM: user-story[0] bug[1] task[2])
Down
Down
Enter
Sleep 1.5s

# What needs to be done?
Type "Add dark mode toggle to settings page"
Enter
Sleep 1.5s

# Why is this needed? (optional — blank to skip)
Enter
Sleep 1.5s

# Done criteria list — Enter picks "Continue to add items" in selectWithBack
Enter
Sleep 1s
Type "Toggle persists across sessions"
Enter
Sleep 1s
# Blank line finishes the list
Enter
Sleep 1.5s

# Create this issue? yes (first select option)
Enter
Sleep 3s

# Create a branch? yes (default = true in confirmWithBack)
Enter
Sleep 1.5s

# Branch description (accept default from issue title)
Enter
Sleep 1.5s

# Create this branch? yes (first select option)
Enter
Sleep 1.5s

# Use done criteria as test plan? yes (first option)
Enter
Sleep 3s

# Show result
Sleep 4s
