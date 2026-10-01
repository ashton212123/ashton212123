// Builds CTRL + ESCAPE — an interactive PowerPoint game.
// Shields (lives) are tracked without macros by keeping one copy of every
// question slide per shield level; hyperlinks move the player between copies.
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pixelIcon } = require("./icons");
const { GAME, COLORS: C, SECTORS, CORE, TAUNTS, RANKS, TEAM } = require("./content");

const A = (f) => path.join(__dirname, "assets", f);
const OUT = process.argv[2] || path.join(__dirname, "out", GAME.pptFile);
const HEAD = "Arial Black", BODY = "Calibri", MONO = "Courier New";
const LETTERS = ["A", "B", "C", "D"];
const ALL = [...SECTORS, CORE];
const MAP_LABELS = ["SCIENCE", "HISTORY", "FUN ZONE", "WORLD", "CORE"];

// ---------------------------------------------------------------- registry
const REG = [];
const STATS = {};
const def = (key, section, master, meta, build) => REG.push({ key, section, master, ...meta, build });
let NUM = {};
const num = (key) => {
  if (!(key in NUM)) throw new Error("unknown slide key " + key);
  return NUM[key];
};
const SPECIAL = new Set(["LAST", "END", "DOC"]);
const link = (to, name) => `LNK|${SPECIAL.has(to) ? to : num(to)}|${String(name).replace(/[^A-Za-z0-9 ]/g, "").trim()}`;

// ---------------------------------------------------------------- icons
const ICONS = {};
const ic = (name, color) => {
  const k = `${name}_${color}`;
  if (!ICONS[k]) throw new Error("icon not preloaded " + k);
  return ICONS[k];
};
async function preloadIcons() {
  const want = [
    ...ALL.map((s) => [s.icon, s.accent]),
    ["FaCheck", C.mint], ["FaCheck", C.bg], ["FaLock", C.locked], ["FaLock", C.amber],
    ["FaExclamationTriangle", C.magenta], ["FaLightbulb", C.amber], ["FaStar", C.amber], ["FaStar", C.line],
    ["FaUnlockAlt", C.mint], ["FaMousePointer", "FFFFFF"],
    ["FaFlag", C.cyan], ["FaMousePointer", C.cyan], ["FaQuestion", C.cyan], ["FaKey", C.cyan],
    ["FaPuzzlePiece", "2DE2E6"], ["FaBookOpen", "FF7A45"], ["FaLaptopCode", "A98BFF"], ["FaClipboardCheck", "9BE564"],
    ["FaBan", C.magenta], ["FaSearch", "9BE564"], ["FaCheckCircle", C.mint],
  ];
  for (const [n, col] of want) ICONS[`${n}_${col}`] = await pixelIcon(n, col);
}

// ---------------------------------------------------------------- helpers
let pres;
const glow = (color, opacity = 0.55, blur = 12) => ({ type: "outer", color, blur, offset: 0, angle: 90, opacity });
const shade = (hex, f = 0.5) => hex.match(/../g).map((h) => Math.round(parseInt(h, 16) * f).toString(16).padStart(2, "0")).join("").toUpperCase();

function txt(s, text, o) {
  s.addText(text, { isTextBox: true, fontFace: BODY, color: C.text, margin: 0, valign: "top", ...o });
}
function panel(s, x, y, w, h, o = {}) {
  const opts = {
    x, y, w, h, rectRadius: o.r ?? 0.12,
    fill: { color: o.fill || C.panel, transparency: o.transp ?? 6 },
    line: { color: o.line || C.line, width: o.lw ?? 1.25 },
  };
  if (o.glow) opts.shadow = glow(o.glow, 0.45, 16);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, opts);
}
function img(s, file, x, y, w, h, extra = {}) {
  s.addImage({ path: file, x, y, w, h, ...extra });
}
function button(s, { x, y, w, h, label, to, kind = "primary", accent = C.cyan, size = 16, name }) {
  const primary = kind === "primary";
  s.addText(label, {
    isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, x, y, w, h,
    fill: { color: primary ? accent : C.panel2 }, line: { color: accent, width: 2 },
    color: primary ? C.bg : C.text, fontFace: HEAD, fontSize: size, align: "center", valign: "middle",
    margin: 0, charSpacing: 1, shadow: glow(accent, primary ? 0.6 : 0.35, 14),
    objectName: link(to, name || label),
  });
}
function iconCircle(s, x, y, d, icon, accent, o = {}) {
  s.addShape(pres.shapes.OVAL, {
    x, y, w: d, h: d, fill: { color: o.fill || C.panel2 }, line: { color: o.line || accent, width: o.lw ?? 2 },
    ...(o.glow === false ? {} : { shadow: glow(accent, 0.45, 12) }),
  });
  const p = d * (o.pad ?? 0.2);
  img(s, icon, x + p, y + p, d - 2 * p, d - 2 * p);
}
function helpBtn(s) {
  s.addText("?", {
    isTextBox: true, shape: pres.shapes.OVAL, x: 12.33, y: 0.28, w: 0.5, h: 0.5,
    fill: { color: C.panel2 }, line: { color: C.cyan, width: 1.75 }, color: C.cyan,
    fontFace: HEAD, fontSize: 16, align: "center", valign: "middle", margin: 0,
    objectName: link("howto", "Help"),
  });
}
function hud(s, { label, accent, lives, frags, help = true }) {
  txt(s, label, { x: 0.5, y: 0.32, w: 5.6, h: 0.42, fontFace: MONO, fontSize: 14, bold: true, color: accent, valign: "middle" });
  txt(s, "FRAGMENTS", { x: 6.2, y: 0.32, w: 1.35, h: 0.42, fontFace: MONO, fontSize: 10, color: C.muted, align: "right", valign: "middle" });
  for (let i = 0; i < 4; i++) img(s, A(i < frags ? "chip.png" : "chip_empty.png"), 7.65 + i * 0.42, 0.36, 0.38, 0.348);
  txt(s, "SHIELDS", { x: 9.35, y: 0.32, w: 1.0, h: 0.42, fontFace: MONO, fontSize: 10, color: C.muted, align: "right", valign: "middle" });
  for (let i = 0; i < 3; i++) img(s, A(i < lives ? "shield.png" : "shield_empty.png"), 10.45 + i * 0.47, 0.33, 0.4, 0.4);
  if (help) helpBtn(s);
}
function dialog(s, { x, y, w, h, tag, tagColor, text, size = 17, textW }) {
  panel(s, x, y, w, h, { line: tagColor, lw: 1.75, glow: tagColor });
  txt(s, tag, {
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.06, x: x + 0.3, y: y - 0.22, w: Math.max(1.3, tag.length * 0.13 + 0.5), h: 0.42,
    fill: { color: tagColor }, color: C.bg, fontFace: MONO, bold: true, fontSize: 13, align: "center", valign: "middle",
  });
  txt(s, text, { x: x + 0.35, y: y + 0.38, w: textW || w - 0.7, h: h - 0.55, fontSize: size, valign: "top", paraSpaceAfter: 4 });
}
function keycap(s, x, y, w, h, label, accent) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: y + 0.16, w, h, rectRadius: 0.2, fill: { color: shade(accent, 0.45) }, line: { color: shade(accent, 0.45), width: 1 },
    shadow: glow(accent, 0.55, 24),
  });
  txt(s, label, {
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y, w, h: h - 0.06,
    fill: { color: C.panel2 }, line: { color: accent, width: 3 }, fontFace: HEAD, fontSize: 58, color: accent,
    align: "center", valign: "middle", charSpacing: 2,
  });
}
function missionMap(s, { x0, y, step, d, current, label = true }) {
  s.addShape(pres.shapes.LINE, { x: x0 + d / 2, y: y + d / 2, w: step * 4, h: 0, line: { color: C.line, width: 3, dashType: "dash" } });
  ALL.forEach((sec, i) => {
    const x = x0 + i * step;
    if (i < current) iconCircle(s, x, y, d, ic("FaCheck", C.bg), C.mint, { fill: C.mint, line: C.mint, pad: 0.24, glow: false });
    else if (i === current) iconCircle(s, x, y, d, ic(sec.icon, sec.accent), sec.accent, { lw: 2.5, pad: 0.2 });
    else iconCircle(s, x, y, d, ic("FaLock", C.locked), C.line, { line: C.line, pad: 0.26, glow: false });
    if (label) {
      txt(s, MAP_LABELS[i], {
        x: x + d / 2 - 0.8, y: y + d + 0.06, w: 1.6, h: 0.28, fontFace: MONO, fontSize: 9, bold: true,
        color: i < current ? C.mint : i === current ? sec.accent : C.locked, align: "center",
      });
    }
  });
}

// ---------------------------------------------------------------- flow
const QLIST = [];
ALL.forEach((sec, si) => sec.questions.forEach((q, qi) => QLIST.push({ ...q, sec, si, qi, n: sec.questions.length, last: qi === sec.questions.length - 1 })));
const nextAfterCorrect = (q, L) => {
  if (q.id === "lock") return "ending";
  if (!q.last) return `q_${QLIST[QLIST.indexOf(q) + 1].id}_${L}`;
  return `intro_${ALL[q.si + 1].id}_${L}`;
};
const wrongTarget = (q, L) => (L > 1 ? `bad_${q.id}_${L - 1}` : "gameover");
const hudLabel = (sec) => (sec === CORE ? "> NULL'S CORE // FINAL GATE" : `> SECTOR ${sec.num} // ${sec.short}`);

// ---------------------------------------------------------------- slides
function defineSlides() {
  // ---------------- MAIN MENU
  def("title", "Main Menu", "MENU", { sound: "start", notes: "TITLE SCREEN. Start Game goes to the story, How to Play opens the rules, Credits shows the team, and Exit Game ends the slide show." }, (s) => {
    keycap(s, 2.55, 0.62, 3.4, 1.5, "CTRL", C.cyan);
    txt(s, "+", { x: 5.95, y: 0.62, w: 1.45, h: 1.5, fontFace: HEAD, fontSize: 54, align: "center", valign: "middle" });
    keycap(s, 7.4, 0.62, 3.4, 1.5, "ESC", C.magenta);
    txt(s, "THE GLITCH WITHIN", { x: 2.0, y: 2.45, w: 9.33, h: 0.5, fontFace: MONO, bold: true, fontSize: 24, color: C.amber, align: "center", charSpacing: 8 });
    const items = [["START GAME", "story1", "primary"], ["HOW TO PLAY", "howto", "secondary"], ["CREDITS", "credits", "secondary"], ["EXIT GAME", "END", "secondary"]];
    items.forEach(([label, to, kind], i) => button(s, { x: 4.67, y: 3.3 + i * 0.82, w: 4.0, h: 0.66, label, to, kind, size: 17 }));
    img(s, A("kai.png"), 1.35, 3.35, 1.85, 2.89);
    img(s, A("null_glitch.png"), 9.7, 3.75, 2.6, 2.06);
    txt(s, "AN EMPOWERMENT TECHNOLOGIES GAMECRAFT PROJECT", { x: 0.5, y: 6.72, w: 12.33, h: 0.32, fontFace: MONO, fontSize: 11, color: C.muted, align: "center", charSpacing: 2 });
  });

  def("howto", "Main Menu", "MENU", { notes: "HOW TO PLAY. The Back button uses the 'Last Slide Viewed' action, so it always returns the player to the slide they came from." }, (s) => {
    txt(s, "> HELP.TXT", { x: 0.5, y: 0.35, w: 4, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.cyan });
    txt(s, "HOW TO PLAY", { x: 0.5, y: 0.72, w: 8, h: 0.75, fontFace: HEAD, fontSize: 34 });
    const cards = [
      ["THE MISSION", ic("FaFlag", C.cyan), "Escape the infected computer by clearing 4 sectors, then unlock the ESC Gate at NULL's Core."],
      ["ANSWER", ic("FaMousePointer", C.cyan), "Click the answer you think is right. Use your MOUSE only, not the keyboard."],
      ["SHIELDS", A("shield.png"), "You start with 3 shields. Each wrong answer breaks one. Lose all 3 and the system crashes."],
      ["CODE FRAGMENTS", A("chip.png"), "Clear a sector to get a Code Fragment (a digit). Write it down! You need all 4 to escape."],
      ["NEED HELP?", ic("FaQuestion", C.cyan), "Click the ? button at the top-right corner anytime to come back to these rules."],
      ["ESCAPE!", ic("FaKey", C.cyan), "Unlock the ESC Gate to win. Keep more shields to earn up to 3 stars."],
    ];
    cards.forEach(([head, icon, body], i) => {
      const x = 0.5 + (i % 3) * 4.195, y = 1.65 + Math.floor(i / 3) * 2.3;
      panel(s, x, y, 3.94, 2.1, { line: C.line });
      s.addShape(pres.shapes.OVAL, { x: x + 0.28, y: y + 0.25, w: 0.75, h: 0.75, fill: { color: C.panel2 }, line: { color: C.cyan, width: 1.75 } });
      const isSprite = icon.includes("chip") || icon.includes("shield");
      img(s, icon, x + 0.4, y + 0.37 + (icon.includes("chip") ? 0.02 : 0), 0.51, isSprite && icon.includes("chip") ? 0.47 : 0.51);
      txt(s, head, { x: x + 1.22, y: y + 0.25, w: 2.55, h: 0.75, fontFace: HEAD, fontSize: 14, color: C.cyan, valign: "middle" });
      txt(s, body, { x: x + 0.28, y: y + 1.13, w: 3.4, h: 0.85, fontSize: 14, color: C.text });
    });
    button(s, { x: 0.5, y: 6.35, w: 2.6, h: 0.62, label: "BACK", to: "LAST", kind: "primary", size: 15 });
    txt(s, "Returns you to the slide you were on.", { x: 3.35, y: 6.35, w: 5, h: 0.62, fontFace: MONO, fontSize: 11, color: C.muted, valign: "middle" });
  });

  def("credits", "Main Menu", "MENU", { notes: "CREDITS. Shows the group members and their roles. The documentation button opens the Word file, which must be saved in the same folder as this game." }, (s) => {
    txt(s, "> CREDITS.TXT", { x: 0.5, y: 0.35, w: 4, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.cyan });
    txt(s, "THE TEAM", { x: 0.5, y: 0.72, w: 8, h: 0.75, fontFace: HEAD, fontSize: 34 });
    txt(s, `${TEAM.group.toUpperCase()}   |   ${TEAM.section}   |   Teacher: ${TEAM.teacher}`, { x: 0.5, y: 1.45, w: 12, h: 0.4, fontFace: MONO, fontSize: 13, bold: true, color: C.muted });
    const roles = [
      ["GAME DESIGNER", "FaPuzzlePiece", "2DE2E6", "Concept, mechanics, rules, and game flow"],
      ["STORY / CONTENT", "FaBookOpen", "FF7A45", "Backstory, characters, and questions"],
      ["POWERPOINT DEV", "FaLaptopCode", "A98BFF", "Slides, hyperlinks, and interactivity"],
      ["TESTER / DOCS", "FaClipboardCheck", "9BE564", "Playtesting and Word documentation"],
    ];
    roles.forEach(([role, icon, col, duty], i) => {
      const x = 0.5 + i * 3.143, y = 2.0;
      const names = TEAM.roles[i].names;
      panel(s, x, y, 2.9, 3.2, { line: col, glow: col });
      iconCircle(s, x + 0.97, y + 0.22, 0.95, ic(icon, col), col, { pad: 0.22 });
      txt(s, role, { x: x + 0.1, y: y + 1.25, w: 2.7, h: 0.38, fontFace: HEAD, fontSize: 13, color: col, align: "center" });
      txt(s, names.map((n, j) => ({ text: n, options: { breakLine: j < names.length - 1 } })), { x: x + 0.1, y: y + 1.68, w: 2.7, h: 0.72, fontSize: 15, bold: true, align: "center", valign: "middle" });
      txt(s, duty, { x: x + 0.25, y: y + 2.5, w: 2.4, h: 0.6, fontSize: 12, color: C.muted, align: "center" });
    });
    txt(s, "Made with Microsoft PowerPoint and Microsoft Word. The story, questions, pixel art, and sound effects are all original.", { x: 0.5, y: 5.4, w: 12.33, h: 0.4, fontSize: 14, color: C.muted, align: "center" });
    button(s, { x: 0.5, y: 6.1, w: 5.6, h: 0.72, label: "OPEN GAME DOCUMENTATION", to: "DOC", kind: "secondary", size: 15, accent: C.amber });
    button(s, { x: 10.03, y: 6.1, w: 2.8, h: 0.72, label: "MAIN MENU", to: "title", kind: "primary", size: 15 });
  });

  // ---------------- STORY
  def("story1", "Story", "MENU", { notes: "STORY 1 of 3. Kai clicks a fake 'You won!' pop-up. Next continues the story; Skip Story jumps straight to Sector 1." }, (s) => {
    txt(s, "> STORY 1/3", { x: 0.5, y: 0.35, w: 4, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.cyan });
    button(s, { x: 10.83, y: 0.3, w: 2.0, h: 0.5, label: "SKIP STORY", to: "intro_s1_3", kind: "secondary", size: 11 });
    // monitor
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.6, y: 0.95, w: 7.6, h: 3.75, rectRadius: 0.15, fill: { color: "161D42" }, line: { color: C.line, width: 4 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 4.85, y: 1.2, w: 7.1, h: 3.25, fill: { color: "0B1430" }, line: { color: "0B1430", width: 0 } });
    txt(s, "E-TECH_GAME_FINAL_v3.pptx", { x: 5.0, y: 1.28, w: 4, h: 0.3, fontFace: MONO, fontSize: 10, color: C.muted });
    for (let i = 0; i < 5; i++) s.addShape(pres.shapes.RECTANGLE, { x: 5.0, y: 1.75 + i * 0.5, w: 1.0 + (i % 3) * 0.3, h: 0.12, fill: { color: "1E2A55" }, line: { color: "1E2A55", width: 0 } });
    // scam pop-up
    s.addShape(pres.shapes.RECTANGLE, { x: 6.3, y: 1.5, w: 5.0, h: 2.7, fill: { color: "FFF3B0" }, line: { color: "D7263D", width: 3 }, shadow: glow("FFC233", 0.7, 20) });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.3, y: 1.5, w: 5.0, h: 0.4, fill: { color: "D7263D" }, line: { color: "D7263D", width: 0 } });
    txt(s, "WINNER!!!", { x: 6.45, y: 1.5, w: 3, h: 0.4, fontFace: MONO, bold: true, fontSize: 12, color: "FFFFFF", valign: "middle" });
    txt(s, "x", { x: 10.85, y: 1.5, w: 0.35, h: 0.4, fontFace: MONO, bold: true, fontSize: 14, color: "FFFFFF", valign: "middle", align: "center" });
    txt(s, "CONGRATULATIONS!!!", { x: 6.3, y: 2.0, w: 5.0, h: 0.5, fontFace: HEAD, fontSize: 20, color: "D7263D", align: "center" });
    txt(s, "You are our 1,000,000th visitor! You WON a FREE PHONE!", { x: 6.6, y: 2.5, w: 4.4, h: 0.65, fontSize: 14, bold: true, color: "2B2B2B", align: "center" });
    txt(s, "CLAIM NOW", { shape: pres.shapes.RECTANGLE, x: 7.75, y: 3.35, w: 2.1, h: 0.52, fill: { color: "D7263D" }, fontFace: HEAD, fontSize: 14, color: "FFFFFF", align: "center", valign: "middle" });
    img(s, ic("FaMousePointer", "FFFFFF"), 9.45, 3.6, 0.5, 0.5);
    s.addShape(pres.shapes.RECTANGLE, { x: 7.9, y: 4.7, w: 1.0, h: 0.2, fill: { color: C.line }, line: { color: C.line, width: 0 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 7.3, y: 4.88, w: 2.2, h: 0.1, fill: { color: C.line }, line: { color: C.line, width: 0 } });
    img(s, A("kai.png"), 1.45, 1.25, 2.1, 3.28);
    dialog(s, {
      x: 0.5, y: 5.3, w: 12.33, h: 1.68, tag: "11:47 PM", tagColor: C.cyan, textW: 9.6,
      text: "It's the night before the E-Tech deadline. Kai is finishing the group's game when a flashing pop-up appears. Without thinking twice... Kai clicks CLAIM NOW.",
    });
    button(s, { x: 10.6, y: 6.22, w: 1.95, h: 0.55, label: "NEXT", to: "story2", kind: "primary", size: 14 });
  });

  def("story2", "Story", "CORE", { sound: "wrong", notes: "STORY 2 of 3. The virus NULL pulls Kai inside the computer." }, (s) => {
    txt(s, "> STORY 2/3", { x: 0.5, y: 0.35, w: 4, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.magenta });
    button(s, { x: 10.83, y: 0.3, w: 2.0, h: 0.5, label: "SKIP STORY", to: "intro_s1_3", kind: "secondary", size: 11, accent: C.magenta });
    txt(s, "ZZZAP!", { x: 0.7, y: 1.0, w: 4.6, h: 1.1, fontFace: HEAD, fontSize: 58, color: C.amber, rotate: -6 });
    img(s, A("kai.png"), 2.0, 2.2, 1.5, 2.34, { rotate: -24 });
    [[1.4, 2.5, 0.16], [3.9, 2.4, 0.12], [1.7, 4.3, 0.12], [3.6, 4.1, 0.18], [4.4, 3.2, 0.1], [1.1, 3.4, 0.1]].forEach(([x, y, d], i) =>
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: d, h: d, fill: { color: i % 2 ? C.cyan : C.magenta }, line: { color: i % 2 ? C.cyan : C.magenta, width: 0 } }));
    img(s, A("null_glitch.png"), 6.4, 0.75, 5.1, 4.04);
    dialog(s, {
      x: 0.5, y: 5.3, w: 12.33, h: 1.68, tag: "NULL", tagColor: C.magenta, textW: 9.6,
      text: "Hahaha! I am NULL, the virus you just let in! I pulled you INSIDE the computer. Your files, your game, and YOU now belong to me!",
    });
    button(s, { x: 10.6, y: 6.22, w: 1.95, h: 0.55, label: "NEXT", to: "story3", kind: "primary", size: 14, accent: C.magenta });
  });

  def("story3", "Story", "MENU", { notes: "STORY 3 of 3. BYTE explains the mission. Begin Mission starts Sector 1 with 3 shields." }, (s) => {
    txt(s, "> STORY 3/3", { x: 0.5, y: 0.35, w: 4, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.cyan });
    img(s, A("byte.png"), 1.2, 1.0, 2.3, 3.59);
    txt(s, "MISSION MAP", { x: 4.3, y: 1.15, w: 6, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.cyan });
    missionMap(s, { x0: 4.45, y: 1.8, step: 1.75, d: 1.0, current: 0 });
    txt(s, "COLLECT 4 CODE FRAGMENTS  >  UNLOCK THE ESC GATE  >  ESCAPE!", { x: 4.3, y: 3.55, w: 8.53, h: 0.4, fontFace: MONO, fontSize: 12, bold: true, color: C.amber });
    for (let i = 0; i < 4; i++) img(s, A("chip.png"), 4.35 + i * 0.6, 4.05, 0.5, 0.46);
    txt(s, "4 CODE FRAGMENTS TO FIND", { x: 4.3, y: 4.6, w: 3.2, h: 0.3, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    for (let i = 0; i < 3; i++) img(s, A("shield.png"), 8.0 + i * 0.6, 4.03, 0.5, 0.5);
    txt(s, "3 SHIELDS TO PROTECT", { x: 7.95, y: 4.6, w: 3.2, h: 0.3, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    dialog(s, {
      x: 0.5, y: 5.3, w: 12.33, h: 1.68, tag: "BYTE", tagColor: C.cyan, textW: 9.3, size: 16,
      text: "Don't panic, Kai! I'm BYTE, this computer's last working antivirus. Cross the 4 sectors, collect 4 Code Fragments, and unlock the ESC Gate at NULL's Core. Careful: each wrong answer breaks one of your 3 shields!",
    });
    button(s, { x: 10.15, y: 6.22, w: 2.4, h: 0.55, label: "BEGIN MISSION", to: "intro_s1_3", kind: "primary", size: 13 });
  });

  // ---------------- SECTORS + CORE
  ALL.forEach((sec, si) => {
    const section = sec === CORE ? "NULL's Core (Final)" : `Sector ${si + 1} - ${sec.short.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase())}`;
    const lives = si === 0 ? [3] : [3, 2, 1]; // Sector 1 always starts with full shields
    lives.forEach((L) => defIntro(sec, si, L, section));
    sec.questions.forEach((q0) => {
      const q = QLIST.find((x) => x.id === q0.id);
      [3, 2, 1].forEach((L) => defQuestion(q, L, section));
      [3, 2, 1].forEach((L) => (q.id === "lock" ? defVictory(q, L, section) : defCorrect(q, L, section)));
      [2, 1].forEach((L) => defWrong(q, L, section));
    });
  });

  // ---------------- ENDINGS
  def("gameover", "Endings", "CORE", { sound: "gameover", notes: "GAME OVER. Reached when the player loses the last shield. Retry Mission restarts Sector 1 with 3 shields." }, (s) => {
    txt(s, "> FATAL ERROR 0x000NULL", { x: 0.6, y: 0.6, w: 6, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.magenta });
    txt(s, "SYSTEM CRASH", { x: 0.6, y: 1.1, w: 7.2, h: 1.1, fontFace: HEAD, fontSize: 50, color: C.magenta });
    txt(s, "All 3 shields are broken. NULL has taken over the computer... but every player deserves a second chance. Reboot and try again!", { x: 0.6, y: 2.4, w: 6.6, h: 1.3, fontSize: 19 });
    for (let i = 0; i < 3; i++) img(s, A("shield_empty.png"), 0.6 + i * 0.75, 3.95, 0.6, 0.6);
    txt(s, "SHIELDS: 0 / 3", { x: 2.95, y: 3.95, w: 3, h: 0.6, fontFace: MONO, fontSize: 14, bold: true, color: C.muted, valign: "middle" });
    button(s, { x: 0.6, y: 5.1, w: 3.3, h: 0.8, label: "RETRY MISSION", to: "intro_s1_3", kind: "primary", accent: C.magenta, size: 16 });
    button(s, { x: 4.15, y: 5.1, w: 2.8, h: 0.8, label: "MAIN MENU", to: "title", kind: "secondary", accent: C.magenta, size: 16 });
    img(s, A("null_glitch.png"), 7.75, 1.3, 4.9, 3.88);
    txt(s, "\"Better luck next time, player. Hehehe!\"", { x: 7.6, y: 5.35, w: 5.2, h: 0.5, fontFace: MONO, fontSize: 13, color: "FF8FC7", align: "center" });
  });

  def("ending", "Endings", "MENU", { notes: "ENDING. Play Again returns to the title screen. Exit Game ends the slide show." }, (s) => {
    txt(s, "> SYSTEM RESTORED", { x: 0.5, y: 0.35, w: 5, h: 0.4, fontFace: MONO, fontSize: 14, bold: true, color: C.mint });
    txt(s, "BACK TO REALITY", { x: 0.5, y: 0.78, w: 7.5, h: 0.8, fontFace: HEAD, fontSize: 34 });
    txt(s, "Kai blinks and wakes up at the desk. The game file is saved, the virus is gone, and a sticky note on the monitor says: THINK BEFORE YOU CLICK.", { x: 0.5, y: 1.65, w: 7.2, h: 1.2, fontSize: 18 });
    const tips = [
      ["FaBan", C.magenta, "Never click 'You won!' pop-ups", "Close them safely and scan your device."],
      ["FaLightbulb", C.amber, "Stay curious", "There is always something new to learn about the world."],
      ["FaSearch", "9BE564", "Check facts before you share", "Not everything you read online is true. Look it up!"],
    ];
    tips.forEach(([icon, col, head, sub], i) => {
      const y = 3.1 + i * 1.12;
      iconCircle(s, 0.5, y, 0.82, ic(icon, col), col, { pad: 0.24 });
      txt(s, head, { x: 1.55, y: y + 0.02, w: 6.2, h: 0.42, fontSize: 18, bold: true, color: col });
      txt(s, sub, { x: 1.55, y: y + 0.42, w: 6.2, h: 0.38, fontSize: 15, color: C.muted });
    });
    // monitor with sticky note
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: 0.9, w: 4.53, h: 3.0, rectRadius: 0.12, fill: { color: "161D42" }, line: { color: C.line, width: 4 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 8.5, y: 1.1, w: 4.13, h: 2.6, fill: { color: "0B1430" }, line: { color: "0B1430", width: 0 } });
    img(s, ic("FaCheckCircle", C.mint), 8.75, 1.35, 0.6, 0.6);
    txt(s, "PROJECT SAVED", { x: 9.45, y: 1.35, w: 3, h: 0.6, fontFace: MONO, bold: true, fontSize: 15, color: C.mint, valign: "middle" });
    txt(s, "0 viruses found", { x: 8.75, y: 2.05, w: 3, h: 0.35, fontFace: MONO, fontSize: 11, color: C.muted });
    txt(s, "THINK BEFORE YOU CLICK!\n- BYTE", {
      shape: pres.shapes.RECTANGLE, x: 10.55, y: 2.25, w: 1.9, h: 1.3, fill: { color: "FFE27A" }, rotate: 5,
      fontFace: MONO, bold: true, fontSize: 11, color: "2B2B2B", align: "center", valign: "middle", margin: 4,
      shadow: glow("000000", 0.5, 8),
    });
    button(s, { x: 8.3, y: 4.45, w: 2.5, h: 0.75, label: "PLAY AGAIN", to: "title", kind: "primary", size: 15 });
    button(s, { x: 8.3, y: 5.4, w: 2.5, h: 0.75, label: "EXIT GAME", to: "END", kind: "secondary", size: 15 });
    img(s, A("kai.png"), 11.15, 4.2, 1.55, 2.42);
    txt(s, "THE END", { x: 0.5, y: 6.65, w: 7.2, h: 0.4, fontFace: MONO, fontSize: 13, bold: true, color: C.amber, charSpacing: 6 });
  });
}

function defIntro(sec, si, L, section) {
  const isCore = sec === CORE;
  const firstQ = sec.questions[0].id;
  def(`intro_${sec.id}_${L}`, section, sec.master, { notes: `SECTOR INTRO: ${sec.name} | Shields: ${L} | Enter goes to the first question (shield level ${L}).` }, (s) => {
    hud(s, { label: isCore ? "> ENTERING NULL'S CORE" : `> ENTERING SECTOR ${sec.num}`, accent: sec.accent, lives: L, frags: si });
    iconCircle(s, 0.6, 1.2, 2.0, ic(sec.icon, sec.accent), sec.accent, { lw: 3, pad: 0.22 });
    txt(s, isCore ? "FINAL SECTOR" : `SECTOR ${sec.num}`, { x: 3.0, y: 1.22, w: 6, h: 0.4, fontFace: MONO, fontSize: 16, bold: true, color: sec.accent });
    txt(s, sec.name, { x: 3.0, y: 1.6, w: 9.83, h: 0.85, fontFace: HEAD, fontSize: 36 });
    txt(s, `Topic: ${sec.topic}`, { x: 3.0, y: 2.48, w: 9.83, h: 0.4, fontSize: 16, color: C.muted });
    img(s, A(isCore ? "null.png" : "byte.png"), isCore ? 0.6 : 0.95, isCore ? 3.55 : 3.3, isCore ? 2.0 : 1.25, isCore ? 1.9 : 1.95);
    dialog(s, { x: 3.0, y: 3.3, w: 9.83, h: 1.75, tag: "BYTE", tagColor: C.cyan, text: sec.intro, size: 16 });
    txt(s, "MISSION MAP", { x: 0.6, y: 5.35, w: 3, h: 0.3, fontFace: MONO, fontSize: 10, bold: true, color: C.muted });
    missionMap(s, { x0: 0.75, y: 5.72, step: 1.75, d: 0.62, current: si });
    button(s, { x: 10.0, y: 5.75, w: 2.83, h: 0.8, label: isCore ? "FACE NULL" : "ENTER SECTOR", to: `q_${firstQ}_${L}`, kind: "primary", accent: sec.accent, size: 16 });
  });
}

function defQuestion(q, L, section) {
  const sec = q.sec;
  const tag = q.id === "boss" ? "FINAL QUESTION" : q.id === "lock" ? "ESC GATE LOCK" : `QUESTION ${q.qi + 1} OF ${q.n}`;
  const targets = q.options.map((_, i) => (i === q.answer ? `ok_${q.id}_${L}` : wrongTarget(q, L)));
  const notes = `QUESTION: ${sec.name} - ${tag} | Shields: ${L} | Correct answer: ${LETTERS[q.answer]} (${q.options[q.answer]}) | Each answer button is linked with Insert > Action > Hyperlink to: Slide.`;
  def(`q_${q.id}_${L}`, section, sec.master, { notes }, (s) => {
    hud(s, { label: hudLabel(sec), accent: sec.accent, lives: L, frags: q.si });
    txt(s, tag, { x: 2.35, y: 0.95, w: 5, h: 0.32, fontFace: MONO, fontSize: 13, bold: true, color: C.amber });
    if (q.speaker === "null") img(s, A("null.png"), 0.45, 1.65, 1.65, 1.57);
    else img(s, A("byte.png"), 0.6, 1.35, 1.35, 2.11);
    panel(s, 2.35, 1.35, 10.48, 2.1, { line: sec.accent, lw: 1.75, glow: sec.accent });
    txt(s, q.q, { x: 2.7, y: 1.45, w: 9.85, h: 1.9, fontSize: 22, valign: "middle" });

    const ans = (i, x, y, w, h, o = {}) => {
      s.addText(o.runs || q.options[i], {
        isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, x, y, w, h,
        fill: { color: C.panel2 }, line: { color: sec.accent, width: 1.75 },
        color: o.color || C.text, fontFace: o.font || (q.mono ? MONO : BODY), bold: !!(o.bold ?? q.mono), fontSize: o.size || 18,
        align: o.align || "left", valign: o.valign || "middle", margin: o.margin || [68, 10, 4, 4],
        objectName: link(targets[i], `Answer ${LETTERS[i]}`),
      });
      const bd = o.badge ?? 0.6;
      const bx = o.bx ?? x + 0.22, by = o.by ?? y + h / 2 - bd / 2;
      s.addText(LETTERS[i], {
        isTextBox: true, shape: pres.shapes.OVAL, x: bx, y: by, w: bd, h: bd, fill: { color: sec.accent }, line: { color: sec.accent, width: 1 },
        color: C.bg, fontFace: HEAD, fontSize: 16, align: "center", valign: "middle", margin: 0,
        objectName: link(targets[i], `Answer ${LETTERS[i]} badge`),
      });
    };

    if (q.type === "mc") {
      const size = Math.max(...q.options.map((o) => o.length)) > 36 ? 16 : 18;
      q.options.forEach((_, i) => ans(i, 0.5 + (i % 2) * 6.33, 3.8 + Math.floor(i / 2) * 1.55, 6.0, 1.35, { size }));
    } else if (q.type === "tf") {
      panel(s, 0.5, 3.75, 7.75, 3.05, { fill: "0E1433", line: C.line, transp: 0 });
      img(s, ic("FaLightbulb", C.amber), 0.75, 3.92, 0.42, 0.42);
      txt(s, "FACT OR MYTH?", { x: 1.3, y: 3.92, w: 5, h: 0.42, fontFace: MONO, fontSize: 13, bold: true, color: C.amber, valign: "middle" });
      s.addShape(pres.shapes.LINE, { x: 0.75, y: 4.48, w: 7.25, h: 0, line: { color: C.line, width: 1 } });
      txt(s, `"${q.claim}"`, { x: 0.8, y: 4.6, w: 7.15, h: 1.65, fontSize: 26, bold: true, valign: "middle" });
      txt(s, `FILE: ${q.file}  //  STATUS: UNVERIFIED`, { x: 0.8, y: 6.3, w: 7.15, h: 0.35, fontFace: MONO, fontSize: 11, color: C.muted, valign: "middle" });
      q.options.forEach((opt, i) => ans(i, 8.55, 3.75 + i * 1.6, 4.28, 1.45, {
        runs: [{ text: opt, options: { fontFace: HEAD, fontSize: 22, breakLine: true } }, { text: q.sub[i], options: { fontFace: BODY, fontSize: 15, color: C.muted } }],
      }));
    } else if (q.type === "table") {
      const rows = [[{ text: "", options: { fill: { color: "2A3366" } } }, ...["A", "B"].map((c) => ({ text: c, options: { bold: true, align: "center", fill: { color: "2A3366" }, color: C.muted } }))]];
      q.sheet.forEach((r, i) => {
        const last = i === q.sheet.length - 1, head = i === 0;
        rows.push([
          { text: String(i + 1), options: { align: "center", color: C.muted, fill: { color: "2A3366" } } },
          { text: r[0], options: { bold: head || last, color: head ? sec.accent : C.text } },
          { text: r[1], options: { bold: head || last, align: "right", color: last ? C.bg : head ? sec.accent : C.text, ...(last ? { fill: { color: C.amber } } : {}) } },
        ]);
      });
      s.addTable(rows, {
        x: 0.5, y: 3.75, w: 4.9, colW: [0.6, 2.35, 1.95], rowH: 0.37, fontFace: MONO, fontSize: 13, color: C.text,
        fill: { color: "0E1433" }, border: { type: "solid", pt: 0.75, color: C.line }, valign: "middle", margin: [0, 0.1, 0, 0.1],
      });
      q.options.forEach((_, i) => ans(i, 5.75, 3.75 + i * 0.77, 7.08, 0.66, { size: 20, badge: 0.5 }));
    } else if (q.type === "doors") {
      q.options.forEach((opt, i) => {
        const x = 0.5 + i * 3.143;
        const doorSize = Math.max(...q.options.map((o) => o.length)) > 14 ? 13 : 20;
        ans(i, x, 3.75, 2.9, 3.0, { font: MONO, bold: true, size: doorSize, align: "center", valign: "bottom", margin: [8, 8, 16, 4], badge: 0.5, bx: x + 0.18, by: 3.9 });
        img(s, A("door.png"), x + 0.86, 3.95, 1.18, 1.4, { objectName: link(targets[i], `Door ${LETTERS[i]}`) });
      });
    } else if (q.type === "lock") {
      img(s, ic("FaLock", C.amber), 0.5, 3.78, 0.5, 0.5);
      txt(s, "ESC GATE  //  ENTER THE 4-DIGIT CODE", { x: 1.15, y: 3.78, w: 9, h: 0.5, fontFace: MONO, fontSize: 16, bold: true, color: C.amber, valign: "middle" });
      q.options.forEach((opt, i) => ans(i, 0.5 + i * 3.143, 4.55, 2.9, 1.9, {
        runs: opt.split("").join(" "), font: MONO, bold: true, size: 40, color: C.amber, align: "center", margin: [4, 4, 4, 4], badge: 0.5, bx: 0.5 + i * 3.143 + 0.15, by: 4.68,
      }));
    }
  });
}

function defCorrect(q, L, section) {
  const sec = q.sec;
  const frag = q.last && sec !== CORE;
  const next = nextAfterCorrect(q, L);
  def(`ok_${q.id}_${L}`, section, sec.master, { sound: "correct", notes: `CORRECT: ${sec.name} - ${q.id} | Shields: ${L}${frag ? ` | Gives Code Fragment ${q.si + 1}: ${sec.fragment}` : ""} | Continue goes to the next challenge.` }, (s) => {
    hud(s, { label: hudLabel(sec), accent: sec.accent, lives: L, frags: frag ? q.si + 1 : q.si });
    img(s, ic("FaCheck", C.mint), 3.0, 1.08, 0.66, 0.66);
    txt(s, "ACCESS GRANTED!", { x: 3.85, y: 1.0, w: 9, h: 0.85, fontFace: HEAD, fontSize: 34, color: C.mint, valign: "middle" });
    img(s, A("kai.png"), 0.75, 1.5, 1.8, 2.81);
    const answerLine = `Correct answer: ${LETTERS[q.answer]}. ${q.options[q.answer]}`;
    txt(s, answerLine, { x: 3.0, y: 1.95, w: 9.83, h: 0.5, fontSize: answerLine.length > 45 ? 18 : 20, bold: true, valign: "middle" });
    panel(s, 3.0, 2.6, 9.83, 2.3, { line: C.mint, lw: 1.5 });
    txt(s, "BYTE EXPLAINS", { x: 3.3, y: 2.78, w: 4, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: C.cyan });
    txt(s, q.explain, { x: 3.3, y: 3.15, w: 9.25, h: 1.6, fontSize: 18 });
    if (frag) {
      panel(s, 3.0, 5.15, 6.6, 1.6, { line: C.amber, lw: 2, glow: C.amber });
      img(s, A("chip.png"), 3.3, 5.48, 1.0, 0.92);
      txt(s, `CODE FRAGMENT ${q.si + 1} OF 4 FOUND!`, { x: 4.5, y: 5.32, w: 3.5, h: 0.6, fontFace: HEAD, fontSize: 14, color: C.amber, valign: "middle" });
      txt(s, "Write it down. You will need it at the ESC Gate!", { x: 4.5, y: 5.92, w: 3.4, h: 0.7, fontSize: 13, color: C.muted });
      txt(s, sec.fragment, {
        shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, x: 8.2, y: 5.35, w: 1.2, h: 1.2, fill: { color: C.bg }, line: { color: C.amber, width: 2 },
        fontFace: MONO, bold: true, fontSize: 54, color: C.amber, align: "center", valign: "middle",
      });
    } else {
      txt(s, sec === CORE ? "CORE PROGRESS" : "SECTOR PROGRESS", { x: 3.0, y: 5.3, w: 4, h: 0.3, fontFace: MONO, fontSize: 11, bold: true, color: C.muted });
      for (let i = 0; i < q.n; i++) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.0 + i * 1.0, y: 5.72, w: 0.85, h: 0.3, rectRadius: 0.06, fill: { color: i <= q.qi ? C.mint : C.panel2 }, line: { color: i <= q.qi ? C.mint : C.line, width: 1 } });
      }
      txt(s, `${q.qi + 1} of ${q.n} cleared`, { x: 3.0 + q.n * 1.0 + 0.1, y: 5.68, w: 3, h: 0.38, fontFace: MONO, fontSize: 12, color: C.mint, valign: "middle" });
    }
    button(s, { x: 10.0, y: 5.75, w: 2.83, h: 0.8, label: "CONTINUE", to: next, kind: "primary", accent: C.mint, size: 16 });
  });
}

function defWrong(q, L, section) {
  const sec = q.sec;
  const taunt = TAUNTS[(QLIST.indexOf(q) + L) % TAUNTS.length];
  def(`bad_${q.id}_${L}`, section, sec.master, { sound: "wrong", notes: `WRONG ANSWER: ${sec.name} - ${q.id} | Shields left: ${L} | Try Again returns to the same question at shield level ${L}.` }, (s) => {
    hud(s, { label: hudLabel(sec), accent: sec.accent, lives: L, frags: q.si });
    img(s, ic("FaExclamationTriangle", C.magenta), 0.5, 1.1, 0.66, 0.66);
    txt(s, "GLITCH DETECTED!", { x: 1.35, y: 1.0, w: 8.2, h: 0.85, fontFace: HEAD, fontSize: 34, color: C.magenta, valign: "middle" });
    txt(s, `NULL: "${taunt}"`, { x: 0.5, y: 1.88, w: 8.9, h: 0.5, fontFace: MONO, fontSize: 15, bold: true, color: "FF8FC7", valign: "middle" });
    panel(s, 0.5, 2.55, 8.9, 1.3, { line: C.magenta, lw: 1.75, glow: C.magenta });
    txt(s, "-1 SHIELD", { x: 0.8, y: 2.55, w: 3.0, h: 1.3, fontFace: HEAD, fontSize: 24, color: C.magenta, valign: "middle" });
    for (let i = 0; i < 3; i++) img(s, A(i < L ? "shield.png" : "shield_empty.png"), 3.9 + i * 0.95, 2.8, 0.8, 0.8);
    txt(s, `${L} LEFT`, { x: 6.85, y: 2.55, w: 2.3, h: 1.3, fontFace: MONO, fontSize: 18, bold: true, valign: "middle", color: L === 1 ? C.magenta : C.text });
    panel(s, 0.5, 4.1, 8.9, 1.55, { line: C.amber, lw: 1.5 });
    img(s, ic("FaLightbulb", C.amber), 0.8, 4.3, 0.42, 0.42);
    txt(s, "BYTE'S HINT", { x: 1.35, y: 4.3, w: 4, h: 0.42, fontFace: MONO, fontSize: 12, bold: true, color: C.amber, valign: "middle" });
    txt(s, q.hint, { x: 0.8, y: 4.8, w: 8.35, h: 0.75, fontSize: 18 });
    img(s, A("null_glitch.png"), 9.75, 1.7, 3.1, 2.45);
    button(s, { x: 0.5, y: 5.95, w: 3.4, h: 0.8, label: "TRY AGAIN", to: `q_${q.id}_${L}`, kind: "primary", accent: C.cyan, size: 16 });
    txt(s, L === 1 ? "Careful! This is your LAST shield." : "Retry the same question with one less shield.", { x: 4.15, y: 5.95, w: 5.3, h: 0.8, fontFace: MONO, fontSize: 12, bold: L === 1, color: L === 1 ? C.magenta : C.muted, valign: "middle" });
  });
}

function defVictory(q, L, section) {
  const r = RANKS[L];
  def(`ok_${q.id}_${L}`, section, CORE.master, { sound: "victory", notes: `VICTORY: escaped with ${L} shield(s) = ${r.stars} star(s), rank ${r.title}. Continue goes to the ending.` }, (s) => {
    hud(s, { label: "> ESC GATE // UNLOCKED", accent: C.mint, lives: L, frags: 4 });
    txt(s, "ESC GATE UNLOCKED!", { x: 0.5, y: 1.0, w: 12.33, h: 0.9, fontFace: HEAD, fontSize: 38, color: C.mint, align: "center", valign: "middle" });
    txt(s, "CODE 6-1-8-3 ACCEPTED  //  YOU ESCAPED THE GLITCH!", { x: 0.5, y: 1.9, w: 12.33, h: 0.45, fontFace: MONO, fontSize: 16, bold: true, color: C.amber, align: "center", valign: "middle" });
    for (let i = 0; i < 3; i++) img(s, ic("FaStar", i < r.stars ? C.amber : C.line), 4.867 + i * 1.25, 2.65, 1.1, 1.1);
    txt(s, r.title, { x: 3.2, y: 3.9, w: 6.93, h: 0.7, fontFace: HEAD, fontSize: 28, color: C.amber, align: "center", valign: "middle" });
    txt(s, r.line, { x: 3.2, y: 4.6, w: 6.93, h: 0.5, fontSize: 18, align: "center", valign: "middle" });
    txt(s, `SHIELDS KEPT: ${L} / 3`, { x: 3.2, y: 5.1, w: 6.93, h: 0.4, fontFace: MONO, fontSize: 13, bold: true, color: C.muted, align: "center", valign: "middle" });
    img(s, A("kai.png"), 1.1, 2.55, 1.9, 2.97);
    img(s, A("byte.png"), 10.33, 2.55, 1.9, 2.97);
    button(s, { x: 5.17, y: 5.85, w: 3.0, h: 0.8, label: "CONTINUE", to: "ending", kind: "primary", accent: C.mint, size: 16 });
  });
}

// ---------------------------------------------------------------- post-process
const SOUNDS = { correct: "snd_correct.wav", wrong: "snd_wrong.wav", victory: "snd_victory.wav", gameover: "snd_gameover.wav", start: "snd_start.wav" };

async function finalize(buf) {
  const zip = await JSZip.loadAsync(buf);
  for (const f of Object.values(SOUNDS)) zip.file(`ppt/media/${f}`, fs.readFileSync(A(f)));
  let ct = await zip.file("[Content_Types].xml").async("string");
  if (!ct.includes('Extension="wav"')) ct = ct.replace("<Default ", '<Default Extension="wav" ContentType="audio/wav"/><Default ');

  let linkCount = 0;
  for (let i = 1; i <= REG.length; i++) {
    const meta = REG[i - 1];
    const sp = `ppt/slides/slide${i}.xml`, rp = `ppt/slides/_rels/slide${i}.xml.rels`;
    let xml = await zip.file(sp).async("string");
    let rels = await zip.file(rp).async("string");
    let maxId = Math.max(0, ...[...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => +m[1]));
    const addRel = (type, target, external) => {
      const id = `rId${++maxId}`;
      rels = rels.replace("</Relationships>", `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"${external ? ' TargetMode="External"' : ""}/></Relationships>`);
      return id;
    };
    const slideRel = {};
    xml = xml.replace(/<p:cNvPr id="(\d+)" name="LNK\|([^|"]+)\|([^"]*)"([^>]*?)>/g, (m, id, target, label, rest) => {
      let h;
      if (target === "LAST") h = '<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=lastslideviewed" highlightClick="1"/>';
      else if (target === "END") h = '<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=endshow" highlightClick="1"/>';
      else if (target === "DOC") h = `<a:hlinkClick r:id="${addRel("hyperlink", GAME.docFile, true)}" highlightClick="1"/>`;
      else {
        slideRel[target] = slideRel[target] || addRel("slide", `slide${target}.xml`);
        h = `<a:hlinkClick r:id="${slideRel[target]}" action="ppaction://hlinksldjump" highlightClick="1"/>`;
      }
      linkCount++;
      return `<p:cNvPr id="${id}" name="Link - ${label}"${rest}>${h}`;
    });
    if (/name="LNK\|/.test(xml)) throw new Error(`unprocessed link on slide ${i}`);
    let snd = "";
    if (meta.sound) {
      const rid = addRel("audio", `../media/${SOUNDS[meta.sound]}`);
      snd = `<p:sndAc><p:stSnd><p:snd r:embed="${rid}" name="${SOUNDS[meta.sound]}"/></p:stSnd></p:sndAc>`;
    }
    xml = xml.replace("</p:clrMapOvr>", `</p:clrMapOvr><p:transition spd="med" advClick="0"><p:fade/>${snd}</p:transition>`);
    zip.file(sp, xml);
    zip.file(rp, rels);
  }

  // de-duplicate identical media (sprites are re-used on many slides)
  const canon = {}, rename = {};
  for (const name of Object.keys(zip.files).filter((n) => n.startsWith("ppt/media/") && !zip.files[n].dir)) {
    const h = crypto.createHash("sha1").update(await zip.file(name).async("nodebuffer")).digest("hex");
    if (canon[h]) { rename[name.slice("ppt/media/".length)] = canon[h].slice("ppt/media/".length); zip.remove(name); }
    else canon[h] = name;
  }
  for (const name of Object.keys(zip.files).filter((n) => n.endsWith(".rels"))) {
    let r = await zip.file(name).async("string"), changed = false;
    r = r.replace(/Target="\.\.\/media\/([^"]+)"/g, (m, f) => (rename[f] ? ((changed = true), `Target="../media/${rename[f]}"`) : m));
    if (changed) zip.file(name, r);
  }
  for (const f of Object.keys(rename)) ct = ct.replace(new RegExp(`<Override PartName="/ppt/media/${f.replace(/\./g, "\\.")}"[^>]*/>`), "");
  zip.file("[Content_Types].xml", ct);
  STATS.links = linkCount;
  console.log(`links: ${linkCount}, media files removed as duplicates: ${Object.keys(rename).length}`);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

// ---------------------------------------------------------------- main
(async () => {
  await preloadIcons();
  defineSlides();
  REG.forEach((r, i) => (NUM[r.key] = i + 1));

  pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = `${GAME.title}: ${GAME.subtitle}`;
  pres.subject = "Empowerment Technologies - GameCraft Performance Task";
  pres.author = `${TEAM.group}, ${TEAM.section}`;
  pres.company = "Empowerment Technologies";
  for (const [m, bg] of [["MENU", "bg_menu.jpg"], ["S1", "bg_s1.jpg"], ["S2", "bg_s2.jpg"], ["S3", "bg_s3.jpg"], ["S4", "bg_s4.jpg"], ["CORE", "bg_core.jpg"]]) {
    pres.defineSlideMaster({ title: m, background: { path: A(bg) }, objects: [] });
  }
  const sections = [];
  REG.forEach((r) => { if (!sections.includes(r.section)) { sections.push(r.section); pres.addSection({ title: r.section }); } });
  REG.forEach((r) => {
    const s = pres.addSlide({ masterName: r.master, sectionTitle: r.section });
    r.build(s);
    s.addNotes(`[Slide ${NUM[r.key]} | ID: ${r.key}] ${r.notes || ""}`);
  });

  const buf = await pres.write({ outputType: "nodebuffer" });
  const out = process.env.RAW ? buf : await finalize(buf);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  fs.writeFileSync(path.join(path.dirname(OUT), "slide_map.json"), JSON.stringify(REG.map((r, i) => ({ n: i + 1, key: r.key, section: r.section })), null, 1));
  fs.writeFileSync(path.join(path.dirname(OUT), "stats.json"), JSON.stringify({ slides: REG.length, links: STATS.links }));
  console.log(`wrote ${OUT} with ${REG.length} slides (${(out.length / 1024).toFixed(0)} KB)`);
})().catch((e) => { console.error(e); process.exit(1); });
