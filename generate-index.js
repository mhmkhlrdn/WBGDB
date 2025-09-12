const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(process.cwd(), "Site/Audio/FILTERED");
const EN_AUDIO_DIR = path.join(process.cwd(), "Site/Audio/EN");
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

    // Base (JP) files
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.endsWith(".mp3"))
      .sort(naturalSort);

    // English files (if folder exists)
    const enFolderPath = path.join(EN_AUDIO_DIR, folder);
    let enFiles = [];
    if (
      fs.existsSync(enFolderPath) &&
      fs.statSync(enFolderPath).isDirectory()
    ) {
      enFiles = fs
        .readdirSync(enFolderPath)
        .filter((f) => f.endsWith(".mp3"))
        .sort(naturalSort);
    }

    const lines = [];
    if (files.length === 5) {
      const labels = ["Play", "Attack", "Death", "Evolve", "Super-Evolve"];
      files.forEach((file, idx) => {
        lines.push({
          name: file,
          url: `Audio/FILTERED/${folder}/${file}`,
          en_url: enFiles[idx] ? `Audio/EN/${folder}/${enFiles[idx]}` : null,
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
          en_url: enFiles[idx] ? `Audio/EN/${folder}/${enFiles[idx]}` : null,
          label,
        });
      });
    } else {
      files.forEach((file, idx) => {
        lines.push({
          name: file,
          url: `Audio/FILTERED/${folder}/${file}`,
          en_url: enFiles[idx] ? `Audio/EN/${folder}/${enFiles[idx]}` : null,
          label: "Play",
        });
      });
    }

    cards[folder] = lines;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`✅ Generated ${OUTPUT_FILE} with en_url support`);
}

generateIndex();
