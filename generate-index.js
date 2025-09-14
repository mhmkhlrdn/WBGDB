const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(process.cwd(), "Site/Audio/FILTERED");
const EN_AUDIO_DIR = path.join(process.cwd(), "Site/Audio/EN");
const OUTPUT_FILE = path.join(process.cwd(), "Site", "cards.json");

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function processCard(folder, cards) {
  const folderPath = path.join(AUDIO_DIR, folder);
  if (!fs.statSync(folderPath).isDirectory()) return;

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

  return lines;
}

function generateIndex() {
  // Load existing cards.json if it exists
  let cards = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existingData = fs.readFileSync(OUTPUT_FILE, 'utf8');
      cards = JSON.parse(existingData);
      console.log(`📖 Loaded existing cards.json with ${Object.keys(cards).length} cards`);
    } catch (error) {
      console.log("⚠️  Could not parse existing cards.json, starting fresh");
    }
  }

  // Check for specific card argument
  const specificCard = process.argv.find(arg => arg.startsWith('--card='));
  if (specificCard) {
    const cardName = specificCard.split('=')[1];
    const cardFolders = fs.readdirSync(AUDIO_DIR);
    const matchingFolder = cardFolders.find(folder => 
      folder.toLowerCase().includes(cardName.toLowerCase())
    );
    
    if (matchingFolder) {
      console.log(`🎯 Processing specific card: ${matchingFolder}`);
      const lines = processCard(matchingFolder, cards);
      cards[matchingFolder] = lines;
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
      console.log(`✅ Updated ${matchingFolder} in ${OUTPUT_FILE}`);
      return;
    } else {
      console.log(`❌ Card "${cardName}" not found in audio directories`);
      console.log(`Available cards: ${cardFolders.join(', ')}`);
      return;
    }
  }

  const cardFolders = fs.readdirSync(AUDIO_DIR);

  for (const folder of cardFolders) {
    const lines = processCard(folder, cards);
    if (!lines) continue;

    // Only update if the card doesn't exist or if we want to force update
    if (!cards[folder] || process.argv.includes('--force')) {
      cards[folder] = lines;
      console.log(`🔄 Updated card: ${folder}`);
    } else {
      console.log(`⏭️  Skipped existing card: ${folder} (use --force to update)`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`✅ Updated ${OUTPUT_FILE} with ${Object.keys(cards).length} cards`);
}

// Show usage help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📋 Usage: node generate-index.js [options]

Options:
  --card=<name>    Update only a specific card (partial name matching)
  --force          Force update all existing cards
  --help, -h       Show this help message

Examples:
  node generate-index.js                           # Update only missing cards
  node generate-index.js --card=congregant         # Update "congregant of truth" card
  node generate-index.js --force                   # Update all cards
  node generate-index.js --card=truth --force      # Force update specific card
`);
  process.exit(0);
}

generateIndex();
