# VHS Tape for devflow doctor
# Checks devflow configuration and dependencies
# Run with: vhs demos/setup/doctor.tape

Output demos/setup/doctor.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

Sleep 1s

# Show the command
Type "devflow doctor"
Enter
Sleep 2s

# Show checks running
Sleep 2s

# Show results
Sleep 3s
