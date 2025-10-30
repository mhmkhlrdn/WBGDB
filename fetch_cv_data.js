const fs = require("fs");
const path = require("path");

async function getFetch() {
  if (typeof fetch === "function") return fetch;
  const mod = await import("node-fetch");
  return mod.default;
}

const jikanRequestTimes = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJikanRateLimit() {

  while (true) {
    const now = Date.now();
    while (jikanRequestTimes.length && now - jikanRequestTimes[0] > 60000) {
      jikanRequestTimes.shift();
    }

    const requestsLastMinute = jikanRequestTimes.length;
    const lastRequestAt = jikanRequestTimes[jikanRequestTimes.length - 1] || 0;
    const sinceLast = now - lastRequestAt;

    const needWaitForSecond = sinceLast < 1000; // 1 per second
    const needWaitForMinute = requestsLastMinute >= 50;

    if (!needWaitForSecond && !needWaitForMinute) {
      return;
    }

    let waitMs = 0;
    if (needWaitForSecond) {
      waitMs = Math.max(waitMs, 1000 - sinceLast);
    }
    if (needWaitForMinute) {
      const oldest = jikanRequestTimes[0];
      waitMs = Math.max(waitMs, 60001 - (now - oldest));
    }
    await sleep(waitMs);
  }
}

function readCardsJson(cardsPath) {
  const raw = fs.readFileSync(cardsPath, "utf8");
  return JSON.parse(raw);
}

function collectUniqueCVs(cards) {
  const names = new Set();
  const nameToSources = new Map();
  for (const cardKey of Object.keys(cards)) {
    const cardObj = cards[cardKey] || {};
    const common = cardObj?.metadata?.common || {};
    const enCV = typeof common.cv === 'string' ? common.cv : '';
    const jpCV = typeof common.jpCV === 'string' ? common.jpCV : '';
    const addSplit = (val, cvType) => {
      if (!val) return;
      val.split('/').map(s => s.trim()).filter(Boolean).forEach(n => {
        names.add(n);
        if (!nameToSources.has(n)) nameToSources.set(n, []);
        nameToSources.get(n).push({ cardKey, cvType });
      });
    };
    addSplit(enCV, 'en');
    addSplit(jpCV, 'jp');
  }
  return { uniqueNames: Array.from(names), nameToSources };
}

async function searchMalPrefix(fetchImpl, name) {
  // Explicitly UTF-8 encode the name for the MAL prefix endpoint
  const encodedKeyword = encodeURIComponent(name);
  const url = `https://myanimelist.net/search/prefix.json?type=person&keyword=${encodedKeyword}&v=1`;

  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`MAL prefix request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  let firstItem = null;
  for (const cat of categories) {
    const items = Array.isArray(cat?.items) ? cat.items : [];
    if (items.length > 0) {
      firstItem = items[0];
      break;
    }
  }
  if (!firstItem && Array.isArray(data?.items) && data.items.length > 0) {
    firstItem = data.items[0];
  }
  if (!firstItem || !firstItem.id) {
    throw new Error("No results from MAL prefix search");
  }
  return firstItem.id;
}

async function fetchJikanPersonFull(fetchImpl, id) {
  await waitForJikanRateLimit();
  const url = `https://api.jikan.moe/v4/people/${encodeURIComponent(String(id))}/full`;
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  if (res.status === 404) {
    const err = new Error(`Jikan 404 Not Found for id ${id}`);
    err.code = 404;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Jikan request failed: ${res.status} ${res.statusText}`);
    err.code = res.status;
    throw err;
  }
  const data = await res.json();
  jikanRequestTimes.push(Date.now());
  return data;
}

async function main() {
  try {
    const fetchImpl = await getFetch();

    const cardsPath = path.join(process.cwd(), "Site", "cards.json");
    if (!fs.existsSync(cardsPath)) {
      throw new Error(`cards.json not found at ${cardsPath}`);
    }
    const cards = readCardsJson(cardsPath);

    const { uniqueNames, nameToSources } = collectUniqueCVs(cards);
    console.log(`Found ${uniqueNames.length} unique CV names`);

    const results = [];
    const notFound404 = [];
    for (const name of uniqueNames) {
      try {
        const malId = await searchMalPrefix(fetchImpl, name);
        const jikanData = await fetchJikanPersonFull(fetchImpl, malId);
        const jd = jikanData?.data || {};
        const filteredVoices = Array.isArray(jd.voices)
          ? jd.voices.map((v) => ({
              role: v?.role || null,
              anime: { title: v?.anime?.title || null, image: v?.anime?.images?.webp?.image_url || null },
              character: { name: v?.character?.name || null, image: v?.character?.images?.webp?.image_url || null },
            }))
          : [];
        const filteredJikan = {
          url: jd.url || null,
          images: jd.images || null,
          name: jd.name || null,
          voices: filteredVoices,
        };
        results.push({
          source: {
            name,
            malPrefix: { id: malId },
          },
          sources: nameToSources.get(name) || [],
          jikan: filteredJikan,
          fetchedAt: new Date().toISOString(),
        });
        console.log(`✓ ${name} → ${malId}`);
      } catch (e) {
        if (e && e.code === 404) {
          notFound404.push(name);
          console.warn(`404 Not Found for ${name}`);
        } else {
          console.warn(`Skipping ${name}: ${e?.message || e}`);
        }
      }
    }

    const outPath = path.join(process.cwd(), "cv_data.json");
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`✅ Wrote ${outPath} with ${results.length} entries`);
    if (notFound404.length) {
      console.log(`\nSummary: ${notFound404.length} Jikan 404 Not Found`);
      notFound404.forEach(n => console.log(` - ${n}`));
    } else {
      console.log(`\nSummary: No Jikan 404 Not Found`);
    }
  } catch (err) {
    console.error("❌ Error:", err?.message || err);
    process.exitCode = 1;
  }
}

main();


