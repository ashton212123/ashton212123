// Renders react-icons to chunky pixel-art PNGs (to match the sprite style).
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const fa = require("react-icons/fa");

const OUT = path.join(__dirname, "assets", "icons");
fs.mkdirSync(OUT, { recursive: true });

const GRID = 22; // pixel grid size
const SCALE = 14; // upscale factor

async function pixelIcon(name, color) {
  const Comp = fa[name];
  if (!Comp) throw new Error("missing icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: 512 })
  );
  const small = await sharp(Buffer.from(svg))
    .resize(GRID - 4, GRID - 4)
    .extend({ top: 2, bottom: 2, left: 2, right: 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = small;
  const r = parseInt(color.slice(0, 2), 16), g = parseInt(color.slice(2, 4), 16), b = parseInt(color.slice(4, 6), 16);
  for (let i = 0; i < data.length; i += 4) {
    const on = data[i + 3] > 100;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = on ? 255 : 0;
  }
  const file = path.join(OUT, `${name}_${color}.png`);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(info.width * SCALE, info.height * SCALE, { kernel: "nearest" })
    .png()
    .toFile(file);
  return file;
}

module.exports = { pixelIcon };

if (require.main === module) {
  (async () => {
    const f = await pixelIcon("FaGlobeAsia", "2DE2E6");
    console.log(f);
  })();
}
