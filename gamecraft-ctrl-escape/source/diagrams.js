// Flowcharts for the Word documentation, drawn as SVG and rasterized with sharp.
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "assets", "doc");
fs.mkdirSync(OUT, { recursive: true });
const F = "Carlito, Calibri, Arial, sans-serif";
const NAVY = "#1A2353", INK = "#0A0F24", CYAN = "#0FB5BA", MAG = "#D61F72", MINT = "#1FA36A", AMBER = "#E0A100", GREY = "#5A6494";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function box(x, y, w, h, fill, title, sub, o = {}) {
  const tc = o.dark ? INK : "#FFFFFF";
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${o.stroke || fill}" stroke-width="3" ${o.dash ? 'stroke-dasharray="10 8"' : ""}/>`;
  const cy = sub ? y + h / 2 - 6 : y + h / 2 + 10;
  s += `<text x="${x + w / 2}" y="${cy}" font-family="${F}" font-size="${o.fs || 30}" font-weight="700" fill="${tc}" text-anchor="middle">${esc(title)}</text>`;
  if (sub) s += `<text x="${x + w / 2}" y="${y + h / 2 + 28}" font-family="${F}" font-size="${o.sfs || 22}" fill="${tc}" text-anchor="middle" opacity="0.92">${esc(sub)}</text>`;
  return s;
}
function diamond(cx, cy, w, h, fill, label) {
  return `<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${fill}"/>` +
    `<text x="${cx}" y="${cy + 9}" font-family="${F}" font-size="26" font-weight="700" fill="#FFFFFF" text-anchor="middle">${esc(label)}</text>`;
}
function arrow(pts, color = GREY, o = {}) {
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const id = "m" + color.replace("#", "");
  let s = `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" ${o.dash ? 'stroke-dasharray="12 9"' : ""} marker-end="url(#${id})"/>`;
  if (o.label) {
    const [lx, ly] = o.at || [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
    s += `<text x="${lx}" y="${ly}" font-family="${F}" font-size="22" font-weight="700" fill="${color}" text-anchor="${o.anchor || "middle"}">${esc(o.label)}</text>`;
  }
  return s;
}
function svg(w, h, body) {
  const markers = [GREY, CYAN, MAG, MINT, AMBER, NAVY].map((c) =>
    `<marker id="m${c.replace("#", "")}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${markers}</defs><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>`;
}

// ---------- 1. overall game flow
function gameFlow() {
  const X = 330, W = 560, H = 96, gap = 44;
  const rows = [
    ["TITLE SCREEN", "Start Game  |  How to Play  |  Credits  |  Exit", NAVY],
    ["STORY (3 slides)", "Kai clicks a fake pop-up and meets NULL and BYTE", "#3B4A8C"],
    ["SECTOR 1: THE WEB GATEWAY", "3 questions  >  Code Fragment 3", "#0E9AA0"],
    ["SECTOR 2: THE FIREWALL FORTRESS", "3 questions  >  Code Fragment 8", "#D45A26"],
    ["SECTOR 3: THE OFFICE ARCHIVES", "3 questions  >  Code Fragment 1", "#6B4FD8"],
    ["SECTOR 4: THE SEARCH MAZE", "3 questions  >  Code Fragment 6", "#4E9A1E"],
    ["NULL'S CORE", "Boss question  >  ESC Gate code lock", MAG],
    ["VICTORY", "1 to 3 stars, based on shields kept", MINT],
    ["ENDING", "Play Again  |  Exit Game", NAVY],
  ];
  let b = "";
  rows.forEach(([t, s, c], i) => {
    const y = 30 + i * (H + gap);
    b += box(X, y, W, H, c, t, s);
    if (i < rows.length - 1) b += arrow([[X + W / 2, y + H], [X + W / 2, y + H + gap - 4]], GREY);
  });
  const yOf = (i) => 30 + i * (H + gap);
  // left branches
  b += box(20, yOf(0) - 5, 250, 70, "#E9EEFF", "HOW TO PLAY", null, { dark: true, fs: 24, stroke: CYAN });
  b += arrow([[X, yOf(0) + 30], [274, yOf(0) + 30]], CYAN);
  b += `<text x="145" y="${yOf(0) + 92}" font-family="${F}" font-size="19" fill="${CYAN}" text-anchor="middle">Back = Last Slide Viewed</text>`;
  b += box(20, yOf(1) - 18, 250, 70, "#E9EEFF", "CREDITS", null, { dark: true, fs: 24, stroke: CYAN });
  b += arrow([[X, yOf(0) + 76], [274, yOf(1) + 17]], CYAN);
  b += `<text x="145" y="${yOf(1) + 78}" font-family="${F}" font-size="19" fill="${CYAN}" text-anchor="middle">opens the Word file</text>`;
  // help from anywhere
  b += box(20, yOf(3) + 6, 250, 84, "#E9EEFF", "? HELP BUTTON", "on every game slide", { dark: true, fs: 24, sfs: 19, stroke: CYAN, dash: true });
  b += arrow([[20, yOf(3) + 48], [8, yOf(3) + 48], [8, yOf(0) + 30], [14, yOf(0) + 30]], CYAN, { dash: true });
  // game over branch
  const GX = 1000, GY = yOf(4) - 10;
  b += box(GX, GY, 300, 116, MAG, "GAME OVER", "System Crash (0 shields)", { sfs: 21 });
  [2, 3, 4, 5, 6].forEach((i) => (b += arrow([[X + W, yOf(i) + H / 2], [GX - 6, GY + 58]], MAG, { dash: true })));
  b += `<text x="${GX + 150}" y="${GY + 150}" font-family="${F}" font-size="21" font-weight="700" fill="${MAG}" text-anchor="middle">Reached when you lose</text>`;
  b += `<text x="${GX + 150}" y="${GY + 176}" font-family="${F}" font-size="21" font-weight="700" fill="${MAG}" text-anchor="middle">all 3 shields, anywhere</text>`;
  b += arrow([[GX + 150, GY], [GX + 150, yOf(2) + 10], [X + W + 8, yOf(2) + 10]], MAG, { label: "Retry Mission", at: [GX + 160, yOf(2) - 6], anchor: "middle" });
  b += arrow([[GX + 300, GY + 58], [1360, GY + 58], [1360, yOf(0) + 48], [X + W + 8, yOf(0) + 48]], MAG, { label: "Main Menu", at: [1170, yOf(0) + 38] });
  // ending branches
  b += arrow([[X, yOf(8) + 48], [300, yOf(8) + 48], [300, yOf(0) + 80], [X - 6, yOf(0) + 80]], NAVY, { label: "Play Again", at: [222, yOf(8) + 40] });
  return svg(1400, yOf(8) + H + 30, b);
}

// ---------- 2. question loop
function questionLoop() {
  let b = "";
  b += box(40, 160, 330, 130, NAVY, "QUESTION SLIDE", "shields = N", { sfs: 24 });
  b += arrow([[370, 225], [470, 225]], GREY);
  b += diamond(590, 225, 230, 150, "#3B4A8C", "Correct?");
  b += arrow([[705, 225], [830, 225]], MINT, { label: "YES", at: [765, 210] });
  b += box(836, 160, 330, 130, MINT, "ACCESS GRANTED", "explanation; shields stay N", { sfs: 21 });
  b += arrow([[1166, 225], [1250, 225]], MINT);
  b += box(1256, 160, 300, 130, "#0E9AA0", "NEXT QUESTION", "or next sector (N)", { sfs: 22 });
  b += arrow([[590, 300], [590, 420]], MAG, { label: "NO", at: [622, 370] });
  b += box(425, 426, 330, 130, MAG, "GLITCH DETECTED", "lose 1 shield + hint", { sfs: 22 });
  b += arrow([[755, 491], [862, 491]], MAG);
  b += diamond(990, 491, 250, 150, "#8A1450", "Shields left?");
  b += arrow([[1115, 491], [1250, 491]], MAG, { label: "0", at: [1180, 476] });
  b += box(1256, 426, 300, 130, INK, "GAME OVER", "Retry or Main Menu", { sfs: 22 });
  b += arrow([[990, 566], [990, 660], [205, 660], [205, 296]], CYAN, { label: "1 or 2: TRY AGAIN on the copy of the same question with N - 1 shields", at: [600, 700] });
  b += `<text x="40" y="70" font-family="${F}" font-size="30" font-weight="700" fill="${NAVY}">Every answer button is a hyperlink. The correct one goes to ACCESS GRANTED;</text>`;
  b += `<text x="40" y="110" font-family="${F}" font-size="30" font-weight="700" fill="${NAVY}">the wrong ones go to GLITCH DETECTED (or straight to GAME OVER on the last shield).</text>`;
  return svg(1600, 740, b);
}

// ---------- 3. shield tracking grid
function shieldGrid() {
  let b = "";
  const cols = ["QUESTION 1", "QUESTION 2", "QUESTION 3"], rowsL = [3, 2, 1];
  const x0 = 250, y0 = 120, cw = 330, ch = 110, gx = 110, gy = 100;
  cols.forEach((c, i) => (b += `<text x="${x0 + i * (cw + gx) + cw / 2}" y="80" font-family="${F}" font-size="28" font-weight="700" fill="${NAVY}" text-anchor="middle">${c}</text>`));
  rowsL.forEach((L, r) => {
    const y = y0 + r * (ch + gy);
    b += `<text x="40" y="${y + ch / 2 + 2}" font-family="${F}" font-size="26" font-weight="700" fill="${CYAN}">${L} SHIELD${L > 1 ? "S" : ""}</text>`;
    b += `<text x="40" y="${y + ch / 2 + 34}" font-family="${F}" font-size="22" fill="${GREY}">${"◆ ".repeat(L)}${"◇ ".repeat(3 - L)}</text>`;
    cols.forEach((_, i) => {
      const x = x0 + i * (cw + gx);
      b += box(x, y, cw, ch, L === 3 ? NAVY : L === 2 ? "#3B4A8C" : "#5B5F8F", `Q${i + 1} copy`, `${L} shield${L > 1 ? "s" : ""} showing`, { fs: 27, sfs: 22 });
      if (i < 2) b += arrow([[x + cw, y + ch / 2], [x + cw + gx - 6, y + ch / 2]], MINT, { label: "correct", at: [x + cw + gx / 2, y + ch / 2 - 12] });
      if (r < 2) b += arrow([[x + cw / 2, y + ch], [x + cw / 2, y + ch + gy - 6]], MAG, { label: "wrong", at: [x + cw / 2 + 12, y + ch + gy / 2 + 8], anchor: "start" });
    });
  });
  const yb = y0 + 3 * (ch + gy) - 30;
  b += box(x0 + 330 + 110 - 20, yb, 370, 90, MAG, "GAME OVER (0 shields)", null, { fs: 26 });
  cols.forEach((_, i) => {
    const x = x0 + i * (cw + gx) + cw / 2;
    b += arrow([[x, y0 + 2 * (ch + gy) + ch], [x0 + 330 + 110 - 20 + 185 + (i - 1) * 120, yb - 4]], MAG, { dash: true });
  });
  return svg(1600, yb + 120, b);
}

(async () => {
  for (const [name, s] of [["flow_game.png", gameFlow()], ["flow_question.png", questionLoop()], ["flow_shields.png", shieldGrid()]]) {
    await sharp(Buffer.from(s)).png().toFile(path.join(OUT, name));
    console.log("wrote", name);
  }
})();
