// Run after putting filtered audio to the respective language folder

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

  const voices = [];
  if (files.length === 5) {
    const labels = ["Play", "Attack", "Death", "Evolve", "Super-Evolve"];
    files.forEach((file, idx) => {
      voices.push({
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

      voices.push({
        name: file,
        url: `Audio/FILTERED/${folder}/${file}`,
        en_url: enFiles[idx] ? `Audio/EN/${folder}/${enFiles[idx]}` : null,
        label,
      });
    });
  } else {
    files.forEach((file, idx) => {
      voices.push({
        name: file,
        url: `Audio/FILTERED/${folder}/${file}`,
        en_url: enFiles[idx] ? `Audio/EN/${folder}/${enFiles[idx]}` : null,
        label: "Play",
      });
    });
  }

  return { voices };
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
      // If user selected an _Alt folder, map to base card
      const isAlt = matchingFolder.endsWith('_Alt');
      const baseFolder = isAlt ? matchingFolder.replace(/_Alt$/, '') : matchingFolder;
      const altFolder = `${baseFolder}_Alt`;

      console.log(`🎯 Processing specific card: ${baseFolder}${isAlt ? ' (from alternate folder)' : ''}`);
      const cardData = processCard(baseFolder, cards);

      // Check for alternate voices in `<Card>_Alt` folders
      const altFilteredPath = path.join(AUDIO_DIR, altFolder);
      let altVoices = null;
      if (fs.existsSync(altFilteredPath) && fs.statSync(altFilteredPath).isDirectory()) {
        const altData = processCard(altFolder, cards);
        altVoices = altData && altData.voices ? altData.voices : null;
        if (altVoices) {
          console.log(`✨ Found alternate voices for ${matchingFolder} in ${altFolder}`);
        }
      }

      const existing = cards[matchingFolder] || {};
      const updated = {
        ...existing,
        voices: cardData?.voices || [],
        metadata: {
          ...(existing.metadata || {}),
          ...(altVoices
            ? {
                alternate: {
                  ...((existing.metadata && existing.metadata.alternate) || {}),
                  voices: altVoices,
                },
              }
            : existing.metadata && existing.metadata.alternate
            ? { alternate: { ...existing.metadata.alternate } }
            : {}),
        },
      };

      cards[matchingFolder] = updated;
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
    const cardData = processCard(folder, cards);
    if (!cardData) continue;

    // Detect alternate voices folder `<Card>_Alt`
    const altFolder = `${folder}_Alt`;
    const altFilteredPath = path.join(AUDIO_DIR, altFolder);
    let altVoices = null;
    if (fs.existsSync(altFilteredPath) && fs.statSync(altFilteredPath).isDirectory()) {
      const altData = processCard(altFolder, cards);
      altVoices = altData && altData.voices ? altData.voices : null;
    }

    // Only update if the card doesn't exist or if we want to force update
    if (!cards[folder] || process.argv.includes('--force')) {
      const existing = cards[folder] || {};
      const updated = {
        ...existing,
        voices: cardData?.voices || [],
        metadata: {
          ...(existing.metadata || {}),
          ...(altVoices
            ? {
                alternate: {
                  ...((existing.metadata && existing.metadata.alternate) || {}),
                  voices: altVoices,
                },
              }
            : existing.metadata && existing.metadata.alternate
            ? { alternate: { ...existing.metadata.alternate } }
            : {}),
        },
      };

      cards[folder] = updated;
      console.log(`🔄 Updated card: ${folder}${altVoices ? ' (+alternate voices)' : ''}`);
    } else {
      console.log(`⏭️  Skipped existing card: ${folder} (use --force to update)`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`✅ Updated ${OUTPUT_FILE} with ${Object.keys(cards).length} cards`);
}

function backfillAlternateVoices() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.log("❌ No existing cards.json found to backfill");
    return;
  }

  let cards;
  try {
    cards = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  } catch (e) {
    console.log("❌ Failed to parse cards.json");
    return;
  }

  const folders = fs.readdirSync(AUDIO_DIR);
  let updatedCount = 0;

  for (const folder of folders) {
    if (!folder.endsWith("_Alt")) continue;
    const base = folder.replace(/_Alt$/, "");
    if (!cards[base]) {
      // Base card not present; skip without creating
      console.log(`⏭️  Skipping ${folder}: base card \"${base}\" not in cards.json`);
      continue;
    }

    const altPath = path.join(AUDIO_DIR, folder);
    if (!fs.existsSync(altPath) || !fs.statSync(altPath).isDirectory()) continue;

    const altData = processCard(folder, cards);
    const altVoices = altData && altData.voices ? altData.voices : null;
    if (!altVoices || altVoices.length === 0) continue;

    const existing = cards[base];
    const existingMeta = existing.metadata || {};
    const existingAlt = existingMeta.alternate || {};

    cards[base] = {
      ...existing,
      metadata: {
        ...existingMeta,
        alternate: {
          ...existingAlt,
          voices: altVoices,
        },
      },
    };
    updatedCount += 1;
    console.log(`✨ Backfilled alternate voices for ${base} from ${folder}`);
  }

  if (updatedCount > 0) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
    console.log(`✅ Backfilled ${updatedCount} cards with alternate voices into ${OUTPUT_FILE}`);
  } else {
    console.log("ℹ️  No alternate folders matched existing cards. Nothing to update.");
  }
}

// Show usage help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📋 Usage: node generate-index.js [options]

Options:
  --card=<name>    Update only a specific card (partial name matching)
  --force          Force update all existing cards
  --backfill-alts  Scan *_Alt folders and append voices to existing cards.json
  --help, -h       Show this help message

Examples:
  node generate-index.js                           # Update only missing cards
  node generate-index.js --card=congregant         # Update "congregant of truth" card
  node generate-index.js --force                   # Update all cards
  node generate-index.js --card=truth --force      # Force update specific card
`);
  process.exit(0);
}

if (process.argv.includes('--backfill-alts')) {
  backfillAlternateVoices();
} else {
  generateIndex();
}
