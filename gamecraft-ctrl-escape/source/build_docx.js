// Builds the Word documentation for CTRL + ESCAPE.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, Header, Footer, PageNumber, TableOfContents, ExternalHyperlink,
  LevelFormat, VerticalAlign, SimpleField, PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo,
  PositionalTabLeader, PageBreak, TabStopType,
} = require("docx");
const { GAME, SECTORS, CORE, RANKS } = require("./content");

const A = (f) => path.join(__dirname, "assets", f);
const OUT = process.argv[2] || path.join(__dirname, "out", GAME.docFile);
const SLIDE_MAP = JSON.parse(fs.readFileSync(process.argv[3] || path.join(__dirname, "out", "slide_map.json")));

const NAVY = "1A2353", INK = "1F2433", TEAL = "0B7C85", MAG = "C2185B", GREY = "5B6382", ROW = "F3F6FF", LINE = "C9D2EE";
const CW = 9360; // content width (DXA) for US Letter with 1" margins
const LETTERS = ["A", "B", "C", "D"];
const ALL = [...SECTORS, CORE];

// ------------------------------------------------------------- text helpers
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
// "**bold**" spans inside strings become bold runs.
function runs(text, o = {}) {
  if (Array.isArray(text)) return text;
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) =>
    part.startsWith("**") ? new TextRun({ ...clean(o), text: part.slice(2, -2), bold: true }) : new TextRun({ ...clean(o), text: part }));
}
const P = (text, o = {}) => new Paragraph({ children: runs(text, o.run || {}), spacing: { after: 120, line: 288 }, ...o.para });
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
let listId = 0;
const bullets = (items) => items.map((t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80, line: 276 }, children: runs(t) }));
const steps = (items) => {
  const instance = ++listId;
  return items.map((t) => new Paragraph({ numbering: { reference: "steps", level: 0, instance }, spacing: { after: 80, line: 276 }, children: runs(t) }));
};
let fig = 0;
const caption = (text) => new Paragraph({
  style: "Caption", alignment: AlignmentType.CENTER,
  children: [new TextRun("Figure "), new SimpleField("SEQ Figure \\* ARABIC", String(++fig)), new TextRun(`. ${text}`)],
});

// ------------------------------------------------------------- images
const DIMS = {};
async function loadDims(files) {
  for (const f of files) { const m = await sharp(f).metadata(); DIMS[f] = [m.width, m.height]; }
}
function image(file, widthIn, alt) {
  const [w, h] = DIMS[file];
  const px = Math.round(widthIn * 96);
  return new ImageRun({
    type: file.endsWith(".png") ? "png" : "jpg", data: fs.readFileSync(file),
    transformation: { width: px, height: Math.round((px * h) / w) },
    altText: { title: alt, description: alt, name: path.basename(file) },
  });
}
const figure = (file, widthIn, alt, cap) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true, children: [image(file, widthIn, alt)] }),
  caption(cap),
];

// ------------------------------------------------------------- tables
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) && content.length && content[0] instanceof Paragraph)
    ? content
    : (Array.isArray(content) ? content : [content]).map((c) => (c instanceof Paragraph ? c : new Paragraph({
      spacing: c instanceof ImageRun ? { before: 40, after: 40 } : { after: 40, line: 264 }, alignment: c instanceof ImageRun ? AlignmentType.CENTER : o.align,
      children: c instanceof ImageRun ? [c] : runs(c, { bold: o.bold, color: o.color, size: o.size, font: o.font }),
    })));
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, children: paras, verticalAlign: o.valign || VerticalAlign.CENTER,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 }, columnSpan: o.span,
  });
}
function table(headers, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const trs = [];
  if (headers) trs.push(new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { fill: NAVY, bold: true, color: "FFFFFF" })) }));
  rows.forEach((r, ri) => trs.push(new TableRow({
    cantSplit: true,
    children: r.map((c, i) => cell(c, widths[i], { fill: (o.fills && o.fills[ri] && o.fills[ri][i]) || (o.zebra !== false && ri % 2 ? ROW : undefined), bold: o.boldFirst && i === 0, color: o.boldFirst && i === 0 ? NAVY : undefined })),
  })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, borders, rows: trs });
}
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });
function callout(title, text, fill = "FFF6D6", edge = "E0A100") {
  const b = { style: BorderStyle.SINGLE, size: 6, color: edge };
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
    rows: [new TableRow({ children: [cell([new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, color: NAVY })] }), ...[].concat(text).map((t) => new Paragraph({ spacing: { after: 40, line: 276 }, children: runs(t) }))], CW, { fill })] })],
  });
}

// ------------------------------------------------------------- document content
function cover() {
  const info = [
    ["Group Name", "[Group Name]"],
    ["Members", ["[Member Name] - Game Designer", "[Member Name] - Story / Content Designer", "[Member Name] - PowerPoint Developer", "[Member Name] - Tester / Documentation Lead"]],
    ["Grade & Section", "[Grade & Section]"],
    ["Subject Teacher", "[Teacher's Name]"],
    ["Date Submitted", "[Date]"],
  ];
  return [
    new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: "EMPOWERMENT TECHNOLOGIES  |  PERFORMANCE TASK", bold: true, color: TEAL, size: 20, characterSpacing: 40 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "GAMECRAFT: Create, Design, Play!", color: GREY, size: 26 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "GAME DOCUMENTATION", font: "Arial Black", color: NAVY, size: 56 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [image(A("doc/shots/title.jpg"), 6.5, "Title screen of CTRL + ESCAPE")] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "CTRL + ESCAPE: ", font: "Arial Black", color: NAVY, size: 40 }), new TextRun({ text: "The Glitch Within", font: "Arial Black", color: MAG, size: 40 })] }),
    new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: "An escape room, story adventure, and quiz game made in Microsoft PowerPoint", italics: true, color: GREY, size: 24 })] }),
    table(null, info, [2400, 6960], { boldFirst: true }),
  ];
}

function tocPage() {
  return [
    new Paragraph({ pageBreakBefore: true, spacing: { after: 240 }, children: [new TextRun({ text: "Table of Contents", font: "Arial Black", size: 36, color: NAVY })] }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    spacer(),
    new Paragraph({ children: [new TextRun({ text: "If the table of contents looks empty, right-click it and choose Update Field.", italics: true, color: GREY, size: 18 })] }),
  ];
}

function overview() {
  return [
    H1("1. Game Overview"),
    P("**CTRL + ESCAPE: The Glitch Within** is an original escape-room adventure built entirely in Microsoft PowerPoint. The player becomes **Kai**, a Senior High School student who gets pulled inside an infected computer after clicking a fake \"You won a FREE phone!\" pop-up. To escape, Kai must cross four computer sectors, answer Empowerment Technologies challenges, protect three shields, and collect four Code Fragments that unlock the ESC Gate guarded by a virus named **NULL**."),
    new Paragraph({
      spacing: { before: 40, after: 160 },
      children: [new TextRun({ text: "Play the game: ", bold: true }), new ExternalHyperlink({ link: GAME.pptFile, children: [new TextRun({ text: GAME.pptFile, style: "Hyperlink" })] }), new TextRun({ text: "  (keep this document and the game in the same folder)", color: GREY })],
    }),
    table(["Item", "Details"], [
      ["Game Title", "CTRL + ESCAPE: The Glitch Within"],
      ["Genre", "Escape Room + Story-Based Adventure + Quiz (Digital Escape Challenge)"],
      ["Platform", "Microsoft PowerPoint in Slide Show mode (Windows or Mac). Saved as a normal .pptx, so no macros are needed."],
      ["Players", "1 player, or a small group deciding answers together"],
      ["Target Audience", "Senior High School students taking Empowerment Technologies, and anyone learning to use computers safely"],
      ["Playing Time", "About 10 to 15 minutes per run"],
      ["Learning Content", "ICT and the Web; online safety, security, and netiquette; productivity tools; online search, research, and intellectual property"],
      ["Game Size", "133 slides, 560 hyperlinks, 5 game areas, 14 challenges, 3 endings (win with 1, 2, or 3 stars) plus Game Over"],
      ["Project Files", `${GAME.pptFile} (the playable game) and ${GAME.docFile} (this document)`],
    ], [2400, 6960], { boldFirst: true }),
    H2("1.1 Objective of the Game"),
    P("Escape the computer by clearing all four sectors, collecting the four Code Fragments, answering NULL's final question, and entering the correct ESC Gate code before losing all three shields."),
    H2("1.2 What Makes It Original"),
    ...bullets([
      "An original story, setting, and cast: Kai (the player), BYTE (the antivirus guide), and NULL (the virus villain).",
      "All pixel art, sound effects, dialogue, and questions are original to this project.",
      "It mixes three genres: a story adventure, a quiz, and an escape-room code puzzle.",
      "A full lives system (shields) built with nothing but hyperlinks, with no macros.",
      "A final twist: NULL scrambles the ESC Gate, so players must enter their fragments in reverse order.",
      "The story teaches its own lesson: the whole adventure starts because Kai clicked a scam pop-up.",
    ]),
  ];
}

function team() {
  return [
    H1("2. The Team: Members and Roles"),
    P("Each member led one part of the project, but everyone helped plan, build, test, and present the game."),
    table(["Role", "Member", "Responsibilities", "Main Outputs"], [
      ["Game Designer", "[Member Name]", "Created the game concept, the shield and fragment mechanics, rules, scoring, and game flow", "Game flowchart, rules, mechanics"],
      ["Story / Content Designer", "[Member Name]", "Wrote the backstory, characters, dialogue, questions, hints, and explanations", "Story slides, question bank"],
      ["PowerPoint Developer", "[Member Name]", "Built the slides, hyperlinks, action buttons, slide masters, transitions, and sounds", "The playable game file (.pptx)"],
      ["Tester / Documentation Lead", "[Member Name]", "Planned and ran playtests, recorded results, and put together this Word document", "Testing log, this documentation"],
    ], [2100, 1900, 3460, 1900], { boldFirst: true }),
    P("[Add a row for each additional group member.]", { run: { italics: true, color: GREY } }),
  ];
}

function story() {
  const sprite = (f) => image(A(f), f === "null.png" ? 0.95 : 0.62, f.replace(".png", " character sprite"));
  return [
    H1("3. Story and Characters"),
    H2("3.1 Backstory"),
    P("It is 11:47 PM, the night before the Empowerment Technologies deadline. Kai is finishing the group's PowerPoint game when a flashing pop-up appears: \"CONGRATULATIONS! You are our 1,000,000th visitor! You WON a FREE PHONE!\" Without thinking twice, Kai clicks **CLAIM NOW**."),
    P("ZZZAP! The pop-up was a trap set by **NULL**, a computer virus that pulls Kai inside the computer. NULL now controls the system and plans to keep Kai, and the group's files, forever."),
    P("Luckily, **BYTE**, the computer's last working antivirus program, finds Kai. BYTE explains the only way out: cross the four sectors of the computer, collect the four Code Fragments, and unlock the ESC Gate at NULL's Core. Every wrong answer lets NULL break one of Kai's three shields. If all of them break, the system crashes."),
    P("When Kai finally escapes, Kai wakes up at the desk. The project is saved, the virus is gone, and a sticky note on the monitor says: **THINK BEFORE YOU CLICK.**"),
    H2("3.2 Characters"),
    table(["", "Character", "Description"], [
      [sprite("kai.png"), ["**Kai**", "The Player"], "A Senior High School student and the hero of the game. Kai is curious and creative but a little too quick to click. Over the adventure, Kai learns to think before clicking."],
      [sprite("byte.png"), ["**BYTE**", "The Guide"], "The computer's last working antivirus program: a friendly robot with a monitor for a head. BYTE introduces each sector, explains every correct answer, and gives hints after mistakes."],
      [sprite("null.png"), ["**NULL**", "The Villain"], "A glitchy virus that got in through the fake pop-up. NULL taunts the player after wrong answers, asks the final question, and scrambles the ESC Gate code."],
    ], [1500, 1700, 6160], { zebra: false, fills: [[NAVY], [NAVY], [NAVY]] }),
    H2("3.3 Setting"),
    P("The game takes place inside Kai's computer, shown as a glowing digital world with a neon grid floor. Each area has its own color so players always know where they are: cyan for the Web Gateway, orange for the Firewall Fortress, violet for the Office Archives, green for the Search Maze, and magenta for NULL's Core."),
    ...figure(A("doc/shots/story1.jpg"), 5.6, "Story slide 1 showing Kai and the fake pop-up", "Story slide 1: Kai clicks the fake \"You won a FREE phone!\" pop-up."),
  ];
}

function world() {
  const rows = [
    ["Sector 1: The Web Gateway", "ICT and the World Wide Web (Web 1.0, 2.0, 3.0; ICT trends; Web 2.0 features)", "3 multiple-choice questions", "Code Fragment 3"],
    ["Sector 2: The Firewall Fortress", "Online safety, security, and netiquette", "Legit-or-Phishing email check, password strength, malware type", "Code Fragment 8"],
    ["Sector 3: The Office Archives", "Productivity tools (Word, Excel, PowerPoint)", "Mail Merge, Excel formula puzzle, PowerPoint hyperlinks", "Code Fragment 1"],
    ["Sector 4: The Search Maze", "Online search, research, and intellectual property", "Choose-a-door search puzzle, reliable sources, copyright", "Code Fragment 6"],
    ["NULL's Core", "Final challenge: think before you click", "Boss question + 4-digit ESC Gate code lock", "Escape + star rank"],
  ];
  return [
    H1("4. Game World: The Five Areas"),
    P("The adventure is divided into four sectors and a final area. Each one covers a different Empowerment Technologies topic and ends with a reward."),
    table(["Area", "E-Tech Topic", "Challenges", "Reward"], rows, [2300, 2900, 2560, 1600], { boldFirst: true }),
    ...figure(A("doc/shots/intro_s1_3.jpg"), 5.6, "Sector 1 entrance slide", "A sector entrance. BYTE gives a briefing and the mission map shows progress."),
  ];
}

function mechanics() {
  return [
    H1("5. Game Mechanics"),
    H2("5.1 Core Gameplay Loop"),
    ...steps([
      "**Read** the situation or question.",
      "**Choose** an answer by clicking a button, a door, or a code.",
      "**Get feedback**: ACCESS GRANTED for a correct answer, GLITCH DETECTED for a wrong one.",
      "**Continue** to the next challenge, or **try again** with one less shield.",
      "**Clear the sector** to collect its Code Fragment, then move to the next sector.",
    ]),
    H2("5.2 Shields (Lives)"),
    P("The player starts with **3 shields**, shown in the top-right corner of every game slide. A wrong answer breaks one shield and shows a hint, and the player retries the same question. Losing the third shield crashes the system (Game Over). Shields never refill, so every answer matters from Sector 1 all the way to NULL's Core."),
    H2("5.3 Code Fragments and the ESC Gate"),
    P("Clearing a sector awards a **Code Fragment**: a single digit shown on that sector's last ACCESS GRANTED slide. The fragments are **3, 8, 1, and 6**. The FRAGMENTS meter in the top bar shows how many have been collected, but not their values, so players must write the digits down. At the ESC Gate, NULL reveals a twist: the code must be entered in **reverse order**, which makes the answer **6-1-8-3**."),
    H2("5.4 Challenge Types"),
    table(["Type", "How It Works", "Where"], [
      ["Multiple Choice", "Four answer buttons (A to D). Click the best answer.", "All areas"],
      ["Legit or Phishing?", "Inspect a suspicious email, then decide if it is LEGIT or PHISHING.", "Sector 2"],
      ["Spreadsheet Puzzle", "Read a mini Excel sheet and pick the formula that opens the vault.", "Sector 3"],
      ["Door Maze", "Four doors, each labeled with a search query. Open the one that leads the right way.", "Sector 4"],
      ["Code Lock", "Pick the correct 4-digit code made from the collected fragments.", "NULL's Core"],
    ], [2300, 5260, 1800], { boldFirst: true }),
    H2("5.5 Feedback and Hints"),
    P("**ACCESS GRANTED** slides confirm the right answer, and BYTE explains why it is correct, so players learn even when they guess. **GLITCH DETECTED** slides show NULL's taunt, the shield that was lost, and a hint from BYTE that points toward the answer without giving it away."),
    H2("5.6 Scoring and Ranks"),
    P("The score is the number of shields kept at the end of the game."),
    table(["Shields Kept", "Stars", "Rank", "Victory Message"], [
      ...[3, 2, 1].map((L) => [`${L} of 3`, `${RANKS[L].stars} star${RANKS[L].stars > 1 ? "s" : ""}`, RANKS[L].title, RANKS[L].line]),
      ["0", "none", "SYSTEM CRASH", "Game Over. Retry the mission from Sector 1."],
    ], [1600, 1300, 2300, 4160], { boldFirst: true }),
    H2("5.7 Win and Lose Conditions"),
    ...bullets([
      "**Win:** answer NULL's final question and unlock the ESC Gate with the correct code while at least one shield is left.",
      "**Lose:** lose all three shields at any point in the game. The player can retry from Sector 1 or return to the main menu.",
    ]),
  ];
}

function rules() {
  return [
    H1("6. Rules of the Game"),
    ...steps([
      "Play in Slide Show mode and use only the **mouse**. Click the buttons on the slides; do not use the arrow keys, space bar, or scroll wheel to change slides.",
      "You begin with **3 shields**. They do not refill during the game.",
      "Every question has exactly **one** correct answer.",
      "A wrong answer breaks **1 shield**, and you must retry the same question until you get it right.",
      "If all 3 shields break, the system crashes and the mission restarts from Sector 1 with 3 shields.",
      "Clear every question in a sector to receive its Code Fragment. **Write every fragment down.**",
      "You may click the **?** button at any time to read the rules. It does not cost a shield.",
      "To win, answer NULL's final question and unlock the ESC Gate with the correct code.",
      "Your rank depends on how many shields you keep.",
      "No peeking at the answer key in this document while playing!",
    ]),
  ];
}

function howToPlay() {
  return [
    H1("7. How to Play"),
    H2("7.1 Getting Started"),
    ...steps([
      `Keep **${GAME.pptFile}** and this Word document in the same folder.`,
      "Open the game in Microsoft PowerPoint. If a yellow Protected View bar appears, click **Enable Editing**.",
      "Turn on your speakers for the sound effects.",
      "Press **F5** (or click **Slide Show > From Beginning**) to start.",
      "On the title screen, click **START GAME**. First-time players should click **HOW TO PLAY** first.",
    ]),
    H2("7.2 Playing the Game"),
    ...steps([
      "Read the three story slides and click **NEXT**, or click **SKIP STORY**.",
      "At each sector entrance, read BYTE's briefing and click **ENTER SECTOR**.",
      "Read each question and click the answer you think is correct.",
      "If you see **ACCESS GRANTED**, read BYTE's explanation and click **CONTINUE**.",
      "If you see **GLITCH DETECTED**, read the hint and click **TRY AGAIN**.",
      "When a Code Fragment appears, write it down.",
      "At NULL's Core, answer the final question, then enter the code to unlock the ESC Gate.",
      "On the ending slide, click **PLAY AGAIN** or **EXIT GAME**.",
    ]),
    H2("7.3 Buttons and Controls"),
    table(["Button", "Where It Appears", "What It Does"], [
      ["START GAME", "Title screen", "Begins the story"],
      ["HOW TO PLAY  /  ?", "Title screen, every game slide", "Opens the rules. BACK returns you to the exact slide you came from."],
      ["CREDITS", "Title screen", "Shows the team and can open this Word document"],
      ["NEXT  /  SKIP STORY", "Story slides", "Moves through the story, or jumps straight to Sector 1"],
      ["ENTER SECTOR  /  FACE NULL", "Sector entrances", "Starts the first question of the area"],
      ["A, B, C, D (and doors)", "Question slides", "Chooses an answer"],
      ["CONTINUE", "ACCESS GRANTED slides", "Goes to the next challenge"],
      ["TRY AGAIN", "GLITCH DETECTED slides", "Retries the same question with one less shield"],
      ["RETRY MISSION  /  MAIN MENU", "Game Over slide", "Restarts Sector 1 with 3 shields, or returns to the title"],
      ["PLAY AGAIN  /  EXIT GAME", "Ending slide", "Returns to the title, or ends the slide show"],
    ], [2700, 2700, 3960], { boldFirst: true }),
    spacer(160),
    callout("Tip for presenting the game", [
      "For a classroom demo, you can lock the game to button clicks only: **Slide Show > Set Up Slide Show > Browsed at a kiosk (full screen)**. In kiosk mode the keyboard cannot skip slides, but PowerPoint restarts the show after 5 minutes with no clicks, so use it only while someone is playing.",
    ]),
  ];
}

function flow() {
  const sections = [];
  SLIDE_MAP.forEach((s) => {
    const last = sections[sections.length - 1];
    if (last && last.name === s.section) last.to = s.n; else sections.push({ name: s.section, from: s.n, to: s.n });
  });
  const desc = {
    "Main Menu": "Title screen, How to Play, Credits",
    Story: "Three story slides",
    "Endings": "Game Over (System Crash) and the ending slide",
  };
  const sectionRows = sections.map((s) => [s.name, `${s.from} to ${s.to}`, String(s.to - s.from + 1),
    desc[s.name] || (s.name.startsWith("NULL") ? "Entrances, boss question, code lock, and 3 victory slides (one per star rank)" : "Entrances, 3 questions, and their feedback slides")]);
  return [
    H1("8. Game Flow and Structure"),
    H2("8.1 Overall Game Flow"),
    P("The flowchart below shows every path through the game, from the title screen to the ending, including the help screen, credits, and Game Over."),
    ...figure(A("doc/flow_game.png"), 6.1, "Flowchart of the whole game", "Overall game flow of CTRL + ESCAPE."),
    H2("8.2 The Question Loop"),
    P("Every challenge in the game follows the same loop. The answer buttons are hyperlinks: the correct one leads to an ACCESS GRANTED slide, and the wrong ones lead to a GLITCH DETECTED slide."),
    ...figure(A("doc/flow_question.png"), 6.4, "Flowchart of a single question", "What happens after the player clicks an answer."),
    H2("8.3 How Shields Are Tracked Without Macros"),
    P("PowerPoint cannot remember a number such as \"shields left\" unless you use VBA macros, which need a macro-enabled file and are often blocked on school computers. We solved this with **slide copies**: every question slide exists in three versions, one for each shield level (3, 2, or 1). Each version shows the correct number of shields, and its hyperlinks lead to the matching versions of the next slides."),
    ...bullets([
      "A **correct** answer moves to the next question at the **same** shield level.",
      "A **wrong** answer moves to the copy of the **same** question with **one less** shield.",
      "A wrong answer with only **one** shield left goes straight to **Game Over**.",
    ]),
    P("Each challenge therefore needs 8 slides: 3 question copies, 3 ACCESS GRANTED slides, and 2 GLITCH DETECTED slides. This is why the game has 133 slides even though it has 14 challenges."),
    ...figure(A("doc/flow_shields.png"), 6.2, "Grid showing the three shield levels for each question", "The slide-copy system that tracks shields."),
    H2("8.4 Slide Map"),
    P("The slides are organized into PowerPoint sections. Open **View > Slide Sorter** in PowerPoint to see them grouped this way."),
    table(["Section", "Slides", "Count", "Contents"], sectionRows, [2700, 1300, 1000, 4360], { boldFirst: true }),
  ];
}

function questionBank() {
  const out = [
    H1("9. Game Content: Question Bank and Answer Key"),
    callout("Teacher's copy: spoilers ahead!", "This section lists every challenge, its correct answer, BYTE's explanation, and the hint shown after a wrong answer.", "FDE7F1", MAG),
  ];
  let n = 0;
  ALL.forEach((sec) => {
    out.push(H2(sec === CORE ? "NULL's Core (Final)" : `Sector ${sec.num.replace(/^0/, "")}: ${sec.name.replace(/^THE /, "The ").replace(/\B\w+/g, (w) => w.toLowerCase())}`));
    out.push(P(`**Topic:** ${sec.topic}${sec.fragment ? `   |   **Reward:** Code Fragment ${sec.fragment}` : ""}`, { para: { keepNext: true } }));
    const rows = sec.questions.map((q) => {
      n++;
      const qText = [`**${q.q}**`];
      if (q.email) qText.push(`(Email from ${q.email.from}: "${q.email.subject}")`);
      q.options.forEach((o, i) => qText.push(`${LETTERS[i]}. ${o}`));
      return [String(n), qText, `**${LETTERS[q.answer]}.** ${q.options[q.answer]}`, [`**Why:** ${q.explain}`, `**Hint:** ${q.hint}`]];
    });
    out.push(table(["No.", "Question and Choices", "Answer", "Explanation and Hint"], rows, [600, 3560, 1700, 3500]));
    out.push(spacer(160));
  });
  return out;
}

function design() {
  const swatches = [
    ["0A0F24", "Deep Navy", "Background of every slide"],
    ["1A2353", "Panel Blue", "Buttons, panels, and dialog boxes"],
    ["2DE2E6", "Cyber Cyan", "BYTE, Sector 1, and main buttons"],
    ["F72585", "Glitch Magenta", "NULL, wrong answers, and NULL's Core"],
    ["4BF0A0", "Access Mint", "Correct answers and victory"],
    ["FFC233", "Fragment Amber", "Code Fragments, hints, and stars"],
    ["FF7A45", "Firewall Orange", "Sector 2"],
    ["A98BFF", "Archive Violet", "Sector 3"],
    ["9BE564", "Maze Lime", "Sector 4"],
  ];
  const sw = (hex) => new TableCell({ width: { size: 900, type: WidthType.DXA }, shading: { fill: hex, type: ShadingType.CLEAR, color: "auto" }, children: [new Paragraph("")], margins: { top: 80, bottom: 80, left: 120, right: 120 } });
  const palette = new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [900, 2300, 1400, 4760], borders,
    rows: [
      new TableRow({ tableHeader: true, children: ["", "Color", "Hex Code", "Used For"].map((h, i) => cell(h, [900, 2300, 1400, 4760][i], { fill: NAVY, bold: true, color: "FFFFFF" })) }),
      ...swatches.map(([hex, name, use]) => new TableRow({ cantSplit: true, children: [sw(hex), cell(`**${name}**`, 2300), cell(`#${hex}`, 1400, { font: "Courier New" }), cell(use, 4760)] })),
    ],
  });
  const shot = (k, alt) => image(A(`doc/shots/${k}.jpg`), 3.0, alt);
  const grid = (pairs) => new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [4680, 4680],
    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
    rows: pairs.map((pair) => new TableRow({
      cantSplit: true,
      children: pair.map(([k, cap]) => new TableCell({
        width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 100, left: 60, right: 60 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [shot(k, cap)] }), caption(cap)],
      })),
    })),
  });
  return [
    H1("10. Visual and Audio Design"),
    H2("10.1 Art Style"),
    P("The game uses **retro pixel art** (8-bit style) set in a dark \"inside the computer\" world with neon grid floors, glowing buttons, and a terminal-style top bar. The characters, shields, fragments, and doors were drawn pixel by pixel on a grid and then enlarged, so every pixel stays sharp on a projector."),
    P("Every game slide shares the same layout, so players always know where to look: area name at the top-left, fragments and shields at the top-right, the question in the center, and the answers below."),
    H2("10.2 Color Palette"),
    palette,
    H2("10.3 Typography"),
    table(["Font", "Used For", "Why"], [
      ["Arial Black", "Titles and buttons", "Thick, bold letters that read like a game logo"],
      ["Calibri", "Questions, story text, and explanations", "Clean and easy to read on a screen"],
      ["Courier New", "Top bar, labels, formulas, search queries, and codes", "Looks like computer code and fits the \"inside the computer\" theme"],
    ], [2000, 3500, 3860], { boldFirst: true }),
    H2("10.4 Sound Effects"),
    P("All sounds are original 8-bit square-wave tones made for this project. They are attached to the slides as transition sounds, so they play automatically."),
    table(["Sound", "When It Plays"], [
      ["Start-up chime", "When the title screen appears"],
      ["Success jingle", "On every ACCESS GRANTED slide"],
      ["Error buzz", "On every GLITCH DETECTED slide and when NULL first appears"],
      ["Victory fanfare", "When the ESC Gate unlocks"],
      ["Crash tune", "On the Game Over (System Crash) slide"],
    ], [2600, 6760], { boldFirst: true }),
    H2("10.5 Screen Designs"),
    grid([
      [["q_s1q1_3", "A question slide with four answer buttons."], ["ok_s1q1_3", "ACCESS GRANTED: BYTE explains the answer."]],
      [["bad_s1q1_1", "GLITCH DETECTED: a shield breaks and BYTE gives a hint."], ["ok_s1q3_3", "Clearing a sector reveals a Code Fragment."]],
    ]),
  ];
}

function tools() {
  return [
    H1("11. How We Used Microsoft Productivity Tools"),
    P("This project used Microsoft Word and Microsoft PowerPoint for different jobs: Word to plan, organize, and document the game, and PowerPoint to build the playable game itself."),
    H2("11.1 Microsoft PowerPoint Features"),
    table(["Feature", "How We Used It in the Game"], [
      ["Hyperlinks and Action Settings (Insert > Action > Hyperlink to: Slide)", "560 links connect every answer, button, and door to the correct slide."],
      ["\"Last Slide Viewed\" action", "The BACK button on How to Play returns players to whatever slide they came from."],
      ["\"End Show\" action", "The EXIT GAME buttons close the slide show."],
      ["Hyperlink to another file", "The Credits slide opens this Word document."],
      ["Slide Masters (View > Slide Master)", "Six masters hold the background art for the menu, each sector, and NULL's Core, so all 133 slides stay consistent."],
      ["Sections", "Slides are grouped into sections (Main Menu, Story, Sector 1, and so on) for easy editing in Slide Sorter."],
      ["Transitions with sound", "Every slide fades in; feedback, victory, and game-over slides play sound effects."],
      ["Turning off \"On Mouse Click\" (Transitions > Advance Slide)", "Clicking an empty part of a slide never skips a question."],
      ["Shapes, Pictures, and Tables", "Buttons, dialog boxes, the inbox mock-up, the Excel mini-sheet, and pixel-art characters."],
      ["Speaker Notes", "Each slide's notes describe its purpose, shield level, and correct answer for the developer and teacher."],
    ], [3500, 5860], { boldFirst: true }),
    H2("11.2 Microsoft Word Features"),
    table(["Feature", "How We Used It in This Document"], [
      ["Styles and Headings", "Consistent headings that also power the table of contents and the Navigation Pane"],
      ["Table of Contents", "An automatic, clickable table of contents"],
      ["Cover Page and Page Breaks", "A title page and a new page for each major section"],
      ["Headers and Footers", "The game title in the header and page numbers (Page X of Y) in the footer"],
      ["Tables with Shading", "Overview, roles, mechanics, question bank, color palette, and test logs"],
      ["Pictures and Captions", "Screenshots, character art, and flowcharts with automatically numbered captions"],
      ["Bulleted and Numbered Lists", "Rules, instructions, and step-by-step procedures"],
      ["Hyperlink to a File", "A link in Section 1 opens the game file"],
    ], [3000, 6360], { boldFirst: true }),
    H2("11.3 From Plan to Finished Game"),
    table(["Stage", "Tool Used", "What We Did"], [
      ["Plan", "Word", "Brainstormed the concept, wrote the story, rules, and question bank, and drew the game flow."],
      ["Create", "PowerPoint", "Built the slide masters, slides, buttons, and links, then added pixel art and sounds."],
      ["Organize", "PowerPoint sections, Word styles", "Grouped 133 slides into sections and organized this document with headings and a table of contents."],
      ["Test", "PowerPoint Slide Show", "Played every path, checked every link, recorded bugs, and fixed them."],
      ["Evaluate", "Word", "Recorded playtest feedback, compared the game with the objectives, and wrote reflections."],
    ], [1500, 2700, 5160], { boldFirst: true }),
    H2("11.4 Work Plan"),
    table(["Phase", "Tasks", "Lead", "Target Date"], [
      ["1. Concept", "Choose the genre, theme, and title; write the game idea", "Game Designer", "[Date]"],
      ["2. Story and Content", "Write the story, characters, 14 challenges, hints, and explanations", "Story / Content Designer", "[Date]"],
      ["3. Design", "Plan the game flow, shield system, layouts, colors, and pixel art", "Game Designer", "[Date]"],
      ["4. Development", "Build the slides, masters, hyperlinks, transitions, and sounds", "PowerPoint Developer", "[Date]"],
      ["5. Testing", "Test every path, run playtests, and fix problems", "Tester / Documentation Lead", "[Date]"],
      ["6. Documentation", "Finish this Word document, add screenshots, and write reflections", "Tester / Documentation Lead", "[Date]"],
      ["7. Presentation", "Rehearse and present the game to the class", "Whole group", "[Date]"],
    ], [2000, 4060, 2100, 1200], { boldFirst: true }),
  ];
}

function testing() {
  const blankRows = (n, cols) => Array.from({ length: n }, () => Array(cols).fill(""));
  return [
    H1("12. Testing and Evaluation"),
    H2("12.1 Technical Checks"),
    P("These checks were completed by scanning every slide and link in the game file."),
    table(["What Was Checked", "Result"], [
      ["Every hyperlink leads to a slide that exists (560 links)", "Passed"],
      ["Every slide can be reached from the title screen (133 of 133)", "Passed"],
      ["Each of the 42 question slides has exactly one correct answer; the other answers remove one shield", "Passed"],
      ["TRY AGAIN keeps the lower shield count; CONTINUE keeps the current count", "Passed"],
      ["A wrong answer on the last shield leads to Game Over", "Passed"],
      ["\"On Mouse Click\" advancing is turned off on every slide", "Passed"],
      ["The file opens without repair errors (Office file format validation)", "Passed"],
    ], [7360, 2000]),
    H2("12.2 Playtest Checklist"),
    P("Complete this checklist while playing the game in Slide Show mode."),
    table(["Check", "Result (Yes / No)", "Notes"], [
      ["Sound effects play on the title, feedback, victory, and Game Over slides", "", ""],
      ["How to Play > BACK returns to the previous slide", "", ""],
      ["EXIT GAME ends the slide show", "", ""],
      ["OPEN GAME DOCUMENTATION opens this Word file", "", ""],
      ["All text fits inside its buttons and boxes", "", ""],
      ["A full winning run takes about 10 to 15 minutes", "", ""],
      ["Three wrong answers lead to Game Over", "", ""],
    ], [5160, 1800, 2400]),
    H2("12.3 Playtest Record"),
    P("Ask classmates to play the game, then record what happened and what you changed."),
    table(["Tester", "Date", "Win / Lose", "Shields Kept", "Feedback", "Changes Made"], blankRows(4, 6), [1500, 1100, 1200, 1200, 2180, 2180]),
    H2("12.4 Evaluation Against the Learning Objectives"),
    table(["Learning Objective", "How Our Project Meets It"], [
      ["Apply appropriate features of MS Word and MS PowerPoint in creating a digital product", "PowerPoint: hyperlinks, actions, slide masters, sections, transitions, and sounds. Word: styles, a table of contents, captions, tables, and headers and footers (Section 11)."],
      ["Design an original game with clear objectives, mechanics, rules, and instructions", "An original story and characters, a clear objective (Section 1), mechanics (Section 5), rules (Section 6), and instructions (Section 7)."],
      ["Use PowerPoint's interactive features to create a playable digital game", "A fully playable game with 560 links, five challenge types, shields, fragments, a code lock, and three victory ranks."],
      ["Demonstrate creativity, collaboration, problem-solving, and digital productivity skills", "Creativity: pixel art, story, and the reverse-code twist. Collaboration: clear roles. Problem-solving: tracking shields without macros. Productivity: planning, testing, and documenting with Office tools."],
    ], [3600, 5760], { boldFirst: true }),
    H2("12.5 Known Limitations and Future Improvements"),
    ...bullets([
      "Keyboard keys (arrows, space bar) can still change slides in normal Slide Show mode. Players should use the mouse, or the teacher can use kiosk mode (see the tip in Section 7).",
      "Because shields are tracked with slide copies, adding one new question means adding 8 new slides.",
      "Future ideas: a timer challenge, a new sector about image editing and online platforms, shuffled questions for replay value, and a two-player mode.",
    ]),
  ];
}

function reflection() {
  const roles = ["Game Designer", "Story / Content Designer", "PowerPoint Developer", "Tester / Documentation Lead"];
  return [
    H1("13. Reflection"),
    P("Each member answers these questions in 3 to 5 sentences:"),
    ...bullets([
      "What did you contribute to the game?",
      "What was the hardest part, and how did you solve it?",
      "What did you learn about using Word and PowerPoint as productivity tools?",
    ]),
    ...roles.flatMap((r) => [
      H3(`[Member Name], ${r}`),
      P("[Write your reflection here.]", { run: { italics: true, color: GREY } }),
    ]),
    H3("Group Reflection"),
    P("[Write what your group learned from creating CTRL + ESCAPE together.]", { run: { italics: true, color: GREY } }),
  ];
}

function references() {
  return [
    H1("14. References and Credits"),
    ...bullets([
      "**Lesson content:** based on the Empowerment Technologies topics in the DepEd K to 12 Senior High School curriculum: ICT and the World Wide Web, online safety, security, and netiquette, productivity tools, and contextualized online search and research.",
      "[Add the textbook or learning module your class uses.]",
      "**Software:** Microsoft PowerPoint (game) and Microsoft Word (documentation).",
      "**Original assets:** the story, characters, questions, pixel art, and sound effects are original to this project. No copyrighted images or music were used.",
      "**Fictional examples:** the \"sch00l-portal-login.net\" email and the \"You WON a FREE PHONE\" pop-up in the game are made-up examples created to teach phishing awareness.",
    ]),
  ];
}

function appendix() {
  const shots = [
    ["howto", "How to Play screen with the BACK button."],
    ["credits", "Credits screen with the link to this document."],
    ["story2", "Story slide 2: NULL appears."],
    ["story3", "Story slide 3: BYTE explains the mission."],
    ["q_s2q1_3", "Sector 2: Legit or Phishing?"],
    ["q_s3q2_3", "Sector 3: the spreadsheet puzzle."],
    ["q_s4q1_3", "Sector 4: the door maze."],
    ["q_boss_3", "NULL's Core: the final question."],
    ["q_lock_3", "The ESC Gate code lock."],
    ["ok_lock_3", "Victory with 3 stars: Cyber Guardian."],
    ["gameover", "Game Over: System Crash."],
    ["ending", "The ending slide."],
  ];
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const rows = [];
  for (let i = 0; i < shots.length; i += 2) {
    rows.push(new TableRow({
      cantSplit: true,
      children: shots.slice(i, i + 2).map(([k, cap]) => new TableCell({
        width: { size: 4680, type: WidthType.DXA }, margins: { top: 60, bottom: 100, left: 60, right: 60 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [image(A(`doc/shots/${k}.jpg`), 3.0, cap)] }), caption(cap)],
      })),
    }));
  }
  return [
    H1("Appendix: Screen Gallery"),
    P("More screens from the finished game."),
    new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [4680, 4680], borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none }, rows }),
  ];
}

// ------------------------------------------------------------- assemble
(async () => {
  const imgs = [
    ...fs.readdirSync(A("doc/shots")).map((f) => A(`doc/shots/${f}`)),
    A("doc/flow_game.png"), A("doc/flow_question.png"), A("doc/flow_shields.png"), A("kai.png"), A("byte.png"), A("null.png"),
  ];
  await loadDims(imgs);

  const headerPara = new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2DE2E6", space: 4 } },
    children: [
      new TextRun({ text: "CTRL + ESCAPE: The Glitch Within", bold: true, color: NAVY, size: 18 }),
      new TextRun({ text: "  |  Game Documentation", color: GREY, size: 18 }),
      new TextRun({ text: "\tEmpowerment Technologies", color: GREY, size: 18 }),
    ],
  });
  const footerPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], color: GREY, size: 18 })],
  });

  const doc = new Document({
    creator: "[Group Name]",
    title: "CTRL + ESCAPE: The Glitch Within - Game Documentation",
    description: "Empowerment Technologies GameCraft performance task: game documentation",
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: "Calibri", size: 22, color: INK } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial Black", size: 34, color: NAVY }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Calibri", size: 28, bold: true, color: TEAL }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Calibri", size: 24, bold: true, color: NAVY }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
        { id: "Caption", name: "caption", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 18, italics: true, color: GREY }, paragraph: { spacing: { before: 40, after: 200 } } },
      ],
    },
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
        { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] },
      ],
    },
    sections: [{
      properties: {
        titlePage: true,
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 720 } },
      },
      headers: { default: new Header({ children: [headerPara] }), first: new Header({ children: [new Paragraph("")] }) },
      footers: { default: new Footer({ children: [footerPara] }), first: new Footer({ children: [new Paragraph("")] }) },
      children: [
        ...cover(), ...tocPage(), ...overview(), ...team(), ...story(), ...world(), ...mechanics(), ...rules(),
        ...howToPlay(), ...flow(), ...questionBank(), ...design(), ...tools(), ...testing(), ...reflection(),
        ...references(), ...appendix(),
      ],
    }],
  });
  const buf = await Packer.toBuffer(doc);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log(`wrote ${OUT} (${(buf.length / 1024).toFixed(0)} KB), figures: ${fig}`);
})().catch((e) => { console.error(e); process.exit(1); });
