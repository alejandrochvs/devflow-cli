# VHS Tape for devflow init
# Initializes devflow configuration in a project
# Run with: vhs demos/setup/init.tape

Output demos/setup/init.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow init"
Enter
Sleep 3s

# Select preset: Down = kanban (second option)
Down
Enter
Sleep 1.5s

# Ticket base URL (leave blank to skip)
Enter
Sleep 1.5s

# Use GitHub Issues? no (default)
Enter
Sleep 1.5s

# Commit scopes: first option (None)
Enter
Sleep 1.5s

# PR checklist: first option (Use defaults)
Enter
Sleep 1.5s

# Customize branch/commit formats? no (default)
Enter
Sleep 3s

# Set up commitlint? yes (default)
Enter
Sleep 1.5s

# Set up husky? yes (default)
Enter
Sleep 1.5s

# Add pre-push hook? yes (default)
Enter
Sleep 1.5s

# Generate GitHub Actions CI workflow? yes (default)
Enter
Sleep 1.5s

# Install AI agent instructions? yes (default)
Enter
Sleep 3s

# Show result — config file created
Type "cat .devflow/config.json"
Enter
Sleep 4s
