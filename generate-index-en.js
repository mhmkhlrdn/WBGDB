// Generate EN voices only: fills en_url for each voice, preserving existing JP name/label/url and structure

const fs = require("fs");
const path = require("path");

const EN_AUDIO_DIR = path.join(process.cwd(), "Site/Audio/EN");
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

function ensureArrayLength(arr, len) {
  const out = Array.isArray(arr) ? arr.slice() : [];
  while (out.length < len) out.push({});
  return out;
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

function upsertEnForFolder(folder, cards) {
  const enPath = path.join(EN_AUDIO_DIR, folder);
  const files = listMp3s(enPath);
  if (files.length === 0) return;

  const existing = cards[folder] || {};
  const existingVoices = Array.isArray(existing.voices) ? existing.voices : [];

  let voices;
  if (existingVoices.length === 0) {
    // Initialize structure with name/label from EN files; leave JP url null
    const labels = buildLabels(files);
    voices = files.map((file, idx) => ({
      name: file,
      label: labels[idx],
      url: null,
      en_url: `Audio/EN/${folder}/${file}`,
    }));
  } else {
    // Only set en_url; do not modify name/label/url
    voices = ensureArrayLength(existingVoices, files.length).map((prior, idx) => ({
      ...prior,
      en_url: `Audio/EN/${folder}/${files[idx]}`,
    }));
  }

  cards[folder] = {
    ...existing,
    voices,
    metadata: { ...(existing.metadata || {}) },
  };
}

function upsertEnAlternate(folder, cards) {
  const altFolder = `${folder}_Alt`;
  const enAltPath = path.join(EN_AUDIO_DIR, altFolder);
  const files = listMp3s(enAltPath);
  if (files.length === 0) return;

  const existing = cards[folder] || {};
  const metadata = existing.metadata || {};
  const existingAlt = (metadata.alternate && Array.isArray(metadata.alternate.voices)) ? metadata.alternate.voices : [];

  let voices;
  if (existingAlt.length === 0) {
    const labels = buildLabels(files);
    voices = files.map((file, idx) => ({
      name: file,
      label: labels[idx],
      url: null,
      en_url: `Audio/EN/${altFolder}/${file}`,
    }));
  } else {
    voices = ensureArrayLength(existingAlt, files.length).map((prior, idx) => ({
      ...prior,
      en_url: `Audio/EN/${altFolder}/${files[idx]}`,
    }));
  }

  cards[folder] = {
    ...existing,
    metadata: {
      ...metadata,
      alternate: {
        ...((metadata && metadata.alternate) || {}),
        voices,
      },
    },
  };
}

function processSpecificCard(cardNameArg, cards) {
  const cardName = cardNameArg.split('=')[1];
  const all = fs.existsSync(EN_AUDIO_DIR) ? fs.readdirSync(EN_AUDIO_DIR) : [];
  const match = all.find((f) => f.toLowerCase().includes(cardName.toLowerCase())) || cardName;

  const base = match.endsWith('_Alt') ? match.replace(/_Alt$/, '') : match;
  upsertEnForFolder(base, cards);
  upsertEnAlternate(base, cards);
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
    const folders = fs.existsSync(EN_AUDIO_DIR)
      ? fs.readdirSync(EN_AUDIO_DIR).filter((f) => !f.endsWith('_Alt'))
      : [];
    folders.forEach((folder) => {
      upsertEnForFolder(folder, cards);
      upsertEnAlternate(folder, cards);
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`✅ EN voices updated in ${OUTPUT_FILE}`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`\n📋 Usage: node generate-index-en.js [--card=<name>]\n`);
  process.exit(0);
}

main();


