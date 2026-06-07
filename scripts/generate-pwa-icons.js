const sharp = require("sharp");
const path = require("path");

const source = path.join(__dirname, "../assets/images/avatar-vida360.png");
const outDir = path.join(__dirname, "../assets/images");

async function main() {
  await sharp(source).resize(192, 192).png().toFile(path.join(outDir, "pwa-192.png"));
  await sharp(source).resize(512, 512).png().toFile(path.join(outDir, "pwa-512.png"));
  await sharp(source)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: "#7f3f98",
    })
    .png()
    .toFile(path.join(outDir, "pwa-512-maskable.png"));
  await sharp(source).resize(180, 180).png().toFile(path.join(outDir, "apple-touch-icon.png"));
  console.log("Ícones PWA gerados em assets/images/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
