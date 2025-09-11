const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(process.cwd(), "Site/Audio/FILTERED");
const OUTPUT_FILE = path.join(process.cwd(), "Site", "cards.json");

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function generateIndex() {
  const cards = {};
  const cardFolders = fs.readdirSync(AUDIO_DIR);

  for (const folder of cardFolders) {
    const folderPath = path.join(AUDIO_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.endsWith(".mp3"))
      .sort(naturalSort);

    const lines = [];
    if (files.length === 5) {
      const labels = ["Play", "Attack", "Death", "Evolve", "Super-Evolve"];
      files.forEach((file, idx) => {
        lines.push({
          name: file,
          url: `Audio/FILTERED/${folder}/${file}`,
          label: labels[idx],
        });
      });
    } else if (files.length > 3) {
      files.forEach((file, idx) => {
        let label;
        if (idx === 0) {
          label = "Play";
        } else if (idx === files.length - 2) {
          label = "Evolve";
        } else if (idx === files.length - 1) {
          label = "Super-Evolve";
        } else {
          label = file; 
        }

        lines.push({
          name: file,
          url: `Audio/FILTERED/${folder}/${file}`,
          label,
        });
      });
    } else {
        let label = "Play";
        files.forEach((file, idx) => {
        lines.push({
          name: file,
          url: `Audio/FILTERED/${folder}/${file}`,
          label: label,
        });
      })
    }

    cards[folder] = lines;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
}

generateIndex();
