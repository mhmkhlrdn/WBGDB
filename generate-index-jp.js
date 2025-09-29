// Generate JP voices only: fills name/label/url for JP, preserves existing data, and does not touch en_url

const fs = require("fs");
const path = require("path");

const JP_AUDIO_DIR = path.join(process.cwd(), "Site/Audio/FILTERED");
const OUTPUT_FILE = path.join(process.cwd(), "Site", "cards.json");

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function listMp3s(dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".mp3"))
    .sort(naturalSort);
}

function buildLabels(files) {
  if (files.length === 5) {
    return ["Play", "Attack", "Death", "Evolve", "Super-Evolve"];
  }
  if (files.length > 3) {
    return files.map((file, idx) => {
      if (idx === 0) return "Play";
      if (idx === files.length - 2) return "Evolve";
      if (idx === files.length - 1) return "Super-Evolve";
      return file;
    });
  }
  return files.map(() => "Play");
}

function upsertJpVoicesForFolder(folder, cards) {
  const folderPath = path.join(JP_AUDIO_DIR, folder);
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) return;

  const files = listMp3s(folderPath);
  if (files.length === 0) return;

  const labels = buildLabels(files);

  const existing = cards[folder] || {};
  const existingVoices = Array.isArray(existing.voices) ? existing.voices : [];

  let voices;
  if (existingVoices.length > 0) {
    // Preserve existing entries; only set JP fields (name/url/label) if missing, never touch en_url
    voices = files.map((file, idx) => {
      const prior = existingVoices[idx] || {};
      return {
        // preserve any existing unknown fields
        ...prior,
        name: prior.name || file,
        url: `Audio/FILTERED/${folder}/${file}`,
        label: prior.label || labels[idx],
        en_url: prior.en_url !== undefined ? prior.en_url : null,
      };
    });
  } else {
    // Create fresh JP voices
    voices = files.map((file, idx) => ({
      name: file,
      url: `Audio/FILTERED/${folder}/${file}`,
      en_url: null,
      label: labels[idx],
    }));
  }

  cards[folder] = {
    ...existing,
    voices,
    metadata: { ...(existing.metadata || {}) },
  };
}

function upsertJpAlternate(folder, cards) {
  const altFolder = `${folder}_Alt`;
  const altPath = path.join(JP_AUDIO_DIR, altFolder);
  if (!fs.existsSync(altPath) || !fs.statSync(altPath).isDirectory()) return;

  const files = listMp3s(altPath);
  if (files.length === 0) return;

  const labels = buildLabels(files);

  const base = folder; // base card key
  const existing = cards[base] || {};
  const metadata = existing.metadata || {};
  const existingAlt = (metadata.alternate && Array.isArray(metadata.alternate.voices)) ? metadata.alternate.voices : [];

  let altVoices;
  if (existingAlt.length > 0) {
    altVoices = files.map((file, idx) => {
      const prior = existingAlt[idx] || {};
      return {
        ...prior,
        name: prior.name || file,
        url: `Audio/FILTERED/${altFolder}/${file}`,
        label: prior.label || labels[idx],
        en_url: prior.en_url !== undefined ? prior.en_url : null,
      };
    });
  } else {
    altVoices = files.map((file, idx) => ({
      name: file,
      url: `Audio/FILTERED/${altFolder}/${file}`,
      en_url: null,
      label: labels[idx],
    }));
  }

  cards[base] = {
    ...existing,
    metadata: {
      ...metadata,
      alternate: {
        ...((metadata && metadata.alternate) || {}),
        voices: altVoices,
      },
    },
  };
}

function processSpecificCard(cardNameArg, cards) {
  const cardName = cardNameArg.split('=')[1];
  const all = fs.readdirSync(JP_AUDIO_DIR);
  const match = all.find((f) => f.toLowerCase().includes(cardName.toLowerCase())) || cardName;

  // Normalize to base if _Alt provided
  const base = match.endsWith('_Alt') ? match.replace(/_Alt$/, '') : match;
  upsertJpVoicesForFolder(base, cards);
  upsertJpAlternate(base, cards);
}

function main() {
  let cards = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      cards = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    } catch {}
  }

  const specificCard = process.argv.find((a) => a.startsWith('--card='));
  if (specificCard) {
    processSpecificCard(specificCard, cards);
  } else {
    const folders = fs.readdirSync(JP_AUDIO_DIR).filter((f) => !f.endsWith('_Alt'));
    folders.forEach((folder) => {
      upsertJpVoicesForFolder(folder, cards);
      upsertJpAlternate(folder, cards);
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`✅ JP voices updated in ${OUTPUT_FILE}`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`\n📋 Usage: node generate-index-jp.js [--card=<name>]\n`);
  process.exit(0);
}

main();


