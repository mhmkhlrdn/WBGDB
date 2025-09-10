const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(process.cwd(), "Audio/FILTERED");
const OUTPUT_FILE = path.join(process.cwd(), "Site", "cards.json");

function generateIndex() {
  const cards = {};
  const cardFolders = fs.readdirSync(AUDIO_DIR);

  for (const folder of cardFolders) {
    const folderPath = path.join(AUDIO_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".mp3"));
    cards[folder] = files.map((file) => ({
      name: file,
      url: `Audio/FILTERED/${folder}/${file}`,
    }));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`Generated ${OUTPUT_FILE}`);
}

generateIndex();
