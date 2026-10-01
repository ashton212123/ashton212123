# CTRL + ESCAPE: The Glitch Within

An Empowerment Technologies **GameCraft** performance task: an escape-room, story, and quiz game made in Microsoft PowerPoint, with its documentation in Microsoft Word.

| File | What it is |
|---|---|
| `CTRL-ESCAPE_Game.pptx` | The playable game (Part 2: PowerPoint) |
| `CTRL-ESCAPE_Game_Documentation.docx` | The game documentation (Part 1: Word) |

Keep both files in the **same folder**. The game's Credits slide opens the Word file, and the Word file links back to the game.

## How to play

1. Open `CTRL-ESCAPE_Game.pptx` in PowerPoint and press **F5**.
2. Use the **mouse only**. Click the on-slide buttons, not the arrow keys.
3. You have 3 shields. A wrong answer breaks one. Clear 4 sectors, write down the 4 Code Fragments, then beat NULL and unlock the ESC Gate.

## Before you submit

Replace the placeholders in square brackets:

- **Word:** cover page (group name, members, section, teacher, date), Section 2 (team table), Section 11.4 (dates), Section 12 (playtest checklist and record), Section 13 (reflections).
- **PowerPoint:** slide 3 (Credits): group name, section, and member names.
- When Word asks to **update fields** on opening, click **Yes** so the table of contents fills in.

## What's inside the game

- 133 slides and 548 hyperlinks, with no macros
- 4 general-knowledge sectors (Science, Philippine History, Everyday Life, Geography) + NULL's Core
- 14 challenges in 5 types: multiple choice, Fact or Myth, receipt puzzle, door maze, code lock
- Shields (lives) tracked with slide copies; Code Fragments; a reverse-code final lock
- Original pixel art and 8-bit sound effects

## Rebuilding (optional)

`source/` holds the scripts that generated both files. You only need them to regenerate the files from scratch; normal edits can be made directly in PowerPoint and Word.

```bash
cd source
npm install
npm run assets          # sprites, backgrounds, sounds, flowcharts (Python + Pillow)
npm run game            # out/CTRL-ESCAPE_Game.pptx
npm run verify          # checks every link and the shield logic
# render screenshots for the docs into assets/doc/shots/ (LibreOffice + pdftoppm), then:
npm run docs            # out/CTRL-ESCAPE_Game_Documentation.docx
```
