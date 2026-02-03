# VHS Tape for devflow doctor
# Checks devflow configuration and dependencies
# Run with: vhs demos/setup/doctor.tape

Output demos/setup/doctor.gif
Set FontSize 18
Set Width 1000
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 75ms

Sleep 1.5s

# Show the command
Type "devflow doctor"
Enter
Sleep 3s

# Show checks running
Sleep 3s

# Show results
Sleep 4s
