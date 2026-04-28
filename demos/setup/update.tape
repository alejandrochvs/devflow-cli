# VHS Tape for devflow update
# Updates AI instructions and Claude Code skill template
# Run with: vhs demos/setup/update.tape

Output demos/setup/update.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow update"
Enter
Sleep 3s

# Update AI_INSTRUCTIONS.md? yes (default)
Enter
Sleep 1.5s

# Update devflow-usage SKILL.md? yes (default)
Enter
Sleep 1.5s

# Add non-interactive section to CLAUDE.md? yes (default)
Enter
Sleep 3s

# Show result
Sleep 4s
