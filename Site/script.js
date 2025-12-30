let isEnglishVoice = false;
let isEnglishUI = true;
let allCards = {};
let currentAudio = null;
let currentButton = null;
let currentCardIndex = -1;
let filteredCards = [];
let currentCardData = null;
let cvDetailsIndex = new Map();
let cvDetailsByKey = {};

// Cookie management utilities
const CookieManager = {
  set(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },

  get(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  },

  delete(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Settings persistence
const Settings = {
  save(key, value) {
    try {
      CookieManager.set(`wbgdb_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save setting:', key, e);
    }
  },

  load(key, defaultValue = null) {
    try {
      const value = CookieManager.get(`wbgdb_${key}`);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.warn('Failed to load setting:', key, e);
      return defaultValue;
    }
  },

  saveFilters(filters) {
    this.save('filters', filters);
  },

  loadFilters() {
    return this.load('filters', {});
  }
};

function splitCVs(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split('/').map(s => s.trim()).filter(Boolean);
}

function getRomajiNameForJpCV(jpCV) {
  if (!jpCV) return "";
  const key = cvDetailsIndex.get(jpCV) || jpCV;
  const entry = cvDetailsByKey[key];
  return entry?.jikan?.name || "";
}

function getDisplayCVName(meta, isAlternate = false, alternateData = null) {
  const altCv = isAlternate ? (alternateData?.cv || '') : '';
  const jpCV = altCv || meta.jpCV || '';
  const enCV = altCv || meta.cv || '';

  // Base selection follows voice language
  const usingEn = isEnglishVoice && !!enCV;
  const usingJp = !isEnglishVoice && !!jpCV;
  if (usingEn) {
    const enParts = splitCVs(enCV);
    if (enParts.length > 0) return enParts.join(' / ');
  }
  if (usingJp) {
    const jpParts = splitCVs(jpCV);
    if (isEnglishUI) {
      const mapped = jpParts.map(p => getRomajiNameForJpCV(p) || p);
      if (mapped.length > 0) return mapped.join(' / ');
    }
    if (jpParts.length > 0) return jpParts.join(' / ');
  }
  // Fallbacks
  if (enCV) return enCV;
  if (jpCV) return jpCV;
  return '';

  // If UI is English and we are showing a JP CV, prefer Jikan English name
  // handled above when building jpParts
}

function openCvDetailsModal(cvKeyOrName) {
  const lb = document.getElementById("cv-details-modal");
  const nameEl = document.getElementById("cv-details-name");
  const imgEl = document.getElementById("cv-details-img");
  const linksEl = document.getElementById("cv-details-links");
  const rolesEl = document.getElementById("cv-details-roles");
  const searchEl = document.getElementById("cv-details-search");
  const prevBtn = document.getElementById("cv-details-prev");
  const nextBtn = document.getElementById("cv-details-next");
  const pageEl = document.getElementById("cv-details-page");
  if (!lb || !nameEl || !imgEl || !linksEl || !rolesEl) return;

  const key = cvDetailsIndex.get(cvKeyOrName) || cvKeyOrName;
  const data = cvDetailsByKey[key];
  if (!data) {
    const displayName = key || String(cvKeyOrName || '');
    nameEl.textContent = displayName;
    imgEl.src = "";
    linksEl.innerHTML = "";
    rolesEl.innerHTML = `<div style="color: var(--muted); font-style: italic; text-align: center; padding: 20px;">${getLocalizedText('Not available')}</div>`;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    return;
  }

  const displayName = data.jikan?.name || key;
  const imageUrl = data.jikan?.images?.jpg?.image_url || "";
  const malUrl = data.jikan?.url || "";
  const allRoles = Array.isArray(data.jikan?.voices) ? data.jikan.voices : [];

  nameEl.textContent = displayName;
  imgEl.src = imageUrl;
  linksEl.innerHTML = "";
  if (malUrl) {
    const link = document.createElement("a");
    link.href = malUrl;
    link.textContent = "MyAnimeList Profile";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    linksEl.appendChild(link);
  }

  let filtered = allRoles.slice();
  let page = 1;
  const pageSize = 9; // 3 columns x 3 rows

  const applySearch = (q) => {
    const query = (q || "").trim().toLowerCase();
    filtered = allRoles.filter(r => {
      const role = (r.role || "").toLowerCase();
      const anime = (r.anime?.title || "").toLowerCase();
      const ch = (r.character?.name || "").toLowerCase();
      return !query || role.includes(query) || anime.includes(query) || ch.includes(query);
    });
    page = 1;
    renderPage();
  };

  const renderPage = () => {
    rolesEl.innerHTML = "";
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(Math.max(1, page), totalPages);
    if (pageEl) pageEl.textContent = `${page} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;

    if (total === 0) {
      rolesEl.innerHTML = `<div style="grid-column: 1 / -1; color: var(--muted); font-style: italic; text-align: center; padding: 20px;">${getLocalizedText('Not available')}</div>`;
      return;
    }

    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    for (let i = start; i < end; i++) {
      const r = filtered[i];
      const role = r.role || "";
      const animeTitle = r.anime?.title || "";
      const animeImg = r.anime?.image || "";
      const charName = r.character?.name || "";
      const charImg = r.character?.image || "";

      // Card layout for each role
      const item = document.createElement("div");
      item.className = "cv-role-card";
      item.style.display = "flex";
      item.style.gap = "8px";
      item.style.alignItems = "center";
      item.style.background = "var(--panel, #232323)";
      item.style.borderRadius = "8px";
      item.style.padding = "8px";
      item.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";

      // Anime image
      const animeImgEl = document.createElement("img");
      animeImgEl.src = animeImg;
      animeImgEl.alt = animeTitle ? `${animeTitle} image` : "Anime image";
      animeImgEl.style.width = "72px";
      animeImgEl.style.height = "96px";
      animeImgEl.style.objectFit = "cover";
      animeImgEl.style.borderRadius = "6px";
      animeImgEl.style.border = "1px solid var(--card-border, #444)";
      animeImgEl.loading = "lazy";
      item.appendChild(animeImgEl);

      // Info block
      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.display = "flex";
      info.style.flexDirection = "column";
      info.style.gap = "2px";
      // Anime title
      const animeTitleEl = document.createElement("div");
      animeTitleEl.textContent = animeTitle;
      animeTitleEl.style.fontWeight = "bold";
      animeTitleEl.style.fontSize = "1em";
      info.appendChild(animeTitleEl);
      // Character name
      const charNameEl = document.createElement("div");
      charNameEl.textContent = charName;
      charNameEl.style.opacity = "0.85";
      charNameEl.style.fontSize = "0.95em";
      info.appendChild(charNameEl);
      // Role
      const roleEl = document.createElement("div");
      roleEl.textContent = role;
      roleEl.style.fontSize = "0.9em";
      roleEl.style.opacity = "0.7";
      info.appendChild(roleEl);
      item.appendChild(info);

      // Character image
      const charImgEl = document.createElement("img");
      charImgEl.src = charImg;
      charImgEl.alt = charName ? `${charName} image` : "Character image";
      charImgEl.style.width = "72px";
      charImgEl.style.height = "96px";
      charImgEl.style.objectFit = "cover";
      charImgEl.style.borderRadius = "6px";
      charImgEl.style.border = "1px solid var(--card-border, #444)";
      charImgEl.loading = "lazy";
      item.appendChild(charImgEl);

      rolesEl.appendChild(item);
    }
  };

  if (searchEl) {
    searchEl.value = "";
    searchEl.oninput = (e) => applySearch(e.target.value);
  }
  if (prevBtn) prevBtn.onclick = () => { page = Math.max(1, page - 1); renderPage(); };
  if (nextBtn) nextBtn.onclick = () => { page = page + 1; renderPage(); };

  applySearch("");

  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
}

function closeCvDetailsModal() {
  const lb = document.getElementById("cv-details-modal");
  if (!lb) return;
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
}

const localization = {
  en: {
    'Search cards...': 'Search cards...',
    'Hide Filters': 'Hide Filters',
    'Show Filters': 'Show Filters',
    'Card Properties': 'Card Properties',
    'Rarity': 'Rarity',
    'Type': 'Type',
    'Class': 'Class',
    'Set': 'Set',
    'Token': 'Token',
    'Stats': 'Stats',
    'Cost': 'Cost',
    'ATK': 'ATK',
    'LIFE': 'LIFE',
    'Content & Creators': 'Content & Creators',
    'Illustrator': 'Illustrator',
    'CV': 'CV',
    'Voices': 'Voices',
    'Alternate Art': 'Alternate Art',
    'Display & Sort': 'Display & Sort',
    'Sort by': 'Sort by',
    'Order': 'Order',
    'View mode': 'View mode',
    'Reset All': 'Reset All',
    'Voice Lines': 'Voice Lines',
    'No voice lines available': 'No voice lines available',
    'Show: Evo': 'Show: Evo',
    'Show: Base': 'Show: Base',
    'Open Image': 'Open Image',
    'Download Image': 'Download Image',
    'Not available': 'Not available',
    'Previous card': 'Previous card',
    'Next card': 'Next card',
    'Close': 'Close',
    'Back to top': 'Back to top',
    'Voice Language': 'Voice Language',
    'UI Language': 'UI Language',
    'Download audio': 'Download audio',
    'Play audio': 'Play audio',
    'Pause audio': 'Pause audio',
    'Play': 'Play',
    'Attack': 'Attack',
    'Effect': 'Effect',
    'Death': 'Death',
    'Evolve': 'Evolve',
    'Super-Evolve': 'Super-Evolve',
    'Enhance': 'Enhance',
    'Any': 'Any',
    'All cards': 'All cards',
    'No tokens': 'No tokens',
    'Tokens only': 'Tokens only',
    'Both': 'Both',
    'With voices': 'With voices',
    'Without voices': 'Without voices',
    'With alternate art': 'With alternate art',
    'Without alternate art': 'Without alternate art',
    'Alphabetical': 'Alphabetical',
    'Ascending': 'Ascending',
    'Descending': 'Descending',
    'List': 'List',
    'Waterfall': 'Waterfall',
    'min': 'min',
    'max': 'max',
    'Bronze': 'Bronze',
    'Silver': 'Silver',
    'Gold': 'Gold',
    'Legendary': 'Legendary',
    'Follower': 'Follower',
    'Amulet': 'Amulet',
    'Spell': 'Spell',
    'Basic': 'Basic',
    'Legends Rise': 'Legends Rise',
    'Infinity Evolved': 'Infinity Evolved',
    'Heirs of the Omen': 'Heirs of the Omen',
    'Neutral': 'Neutral',
    'Forest': 'Forest',
    'Sword': 'Sword',
    'Rune': 'Rune',
    'Dragon': 'Dragon',
    'Abyss': 'Abyss',
    'Haven': 'Haven',
    'Portal': 'Portal',
    'Maeve': 'Maeve',
    'Salefa': 'Salefa',
    'Yurius': 'Yurius',
    'Vier': 'Vier',
    'Zwei': 'Zwei',
    'Wards': 'Wards',
    'Phildau': 'Phildau',
    'Bayle': 'Bayle',
    'Rusty': 'Rusty',
    'Kit': 'Kit',
    'Amalia': 'Amalia',
    'Reno': 'Reno',
    'Sarissa': 'Sarissa',
    'Norman': 'Norman',
    'Heirs': 'Heirs',
    'Himeka': 'Himeka',
    'Krulle': 'Krulle',
    'Sinciro': 'Sinciro',
    'Sham-Nacha': 'Sham-Nacha',
    'Velharia': 'Velharia',
    'Axia': 'Axia',
    'Lishenna': 'Lishenna',
    'Galmieux': 'Galmieux',
    'Raio': 'Raio',
    'Izudia': 'Izudia',
    'Rulenye & Valnereik': 'Rulenye & Valnereik',
    'Marwynn': 'Marwynn',
    'Octrice': 'Octrice',
    'Balto': 'Balto',
    'Valse': 'Valse',
    'Orthrus': 'Orthrus',
    'Cerberus': 'Cerberus',
    'Mimi': 'Mimi',
    'Coco': 'Coco',
    'Aether': 'Aether',
    'Charon': 'Charon',
    'Azurifrit': 'Azurifrit',
    'Inspirational One': 'Inspirational One',
    'Omens': 'Omens',
    'Albert': 'Albert',
    'Seria': 'Seria',
    'Rosé': 'Rosé',
    'Orchis': 'Orchis',
    'Supreme Silver Dragon': 'Supreme Silver Dragon',
    'Supreme Golden Dragon': 'Supreme Golden Dragon',
    'Prim': 'Prim',
    'Hnikar & Jafnhar': 'Hnikar & Jafnhar',
    'Grimnir': 'Grimnir',
    'Sylvia': 'Sylvia',
    'Olivia': 'Olivia',
    'Odin': 'Odin',
    'Glade': 'Glade',
    'Zirconia': 'Zirconia',
    'Edelweiss': 'Edelweiss',
    'Liu Feng': 'Liu Feng',
    'Mukan': 'Mukan',
    'Alouette': 'Alouette',
    'Ronavero': 'Ronavero',
    'Luminous Knights': 'Luminous Knights',
    'Eyfa': 'Eyfa',
    'Zell': 'Zell',
    'Forte': 'Forte',
    'Miriam': 'Miriam',
    'Filene': 'Filene',
    'Amelia': 'Amelia',
    'Gelt': 'Gelt',
    'Liam': 'Liam',
    'Anne & Grea': 'Anne & Grea',
  },
  jp: {
    'Anne & Grea': 'アン＆グレア',
    'Liam': 'リーアム',
    'Forte': 'フォルテ',
    'Miriam': 'ミリアム',
    'Filene': 'フィルレイン',
    'Eyfa': 'エイファ',
    'Amelia': 'エミリア',
    'Gelt': 'ゲルト',
    'Luminous Knights': 'ルミナス',
    'Zell': 'ゼル',
    'Odin': 'オーディン',
    'Glade': 'バックウッド',
    'Zirconia': 'スタチウム',
    'Edelweiss': 'エーデルワイス',
    'Liu Feng': 'リュウフウ',
    'Mukan': 'ムカン',
    'Alouette': 'アルエット',
    'Ronavero': 'ロナヴェロ',
    'Sylvia': 'シルヴィア',
    'Olivia': 'オリヴィエ',
    'Cerberus': 'ケルベロス',
    'Hnikar & Jafnhar': 'フニカル＆ヤヴンハール',
    'Grimnir': 'グリームニル',
    'Prim': 'プリム',
    'Supreme Silver Dragon': '覇道の銀龍',
    'Supreme Golden Dragon': '覇道の金龍',
    'Rosé': 'ロゼ',
    'Orchis': 'オーキス',
    'Orthrus': 'オルトロス',
    'Inspirational One': '嘆きに立ちし者',
    'Omens': '絶傑',
    'Orchis': 'オーキス',
    'Seria': 'セリエ',
    'Valse': 'ワルツ',
    'Coco': 'ココ',
    'Mimi': 'ミミ',
    'Albert': 'アルベール',
    'Azurifrit': 'アジュラフリート',
    'Aether': 'アイテール',
    'Charon': 'カローン',
    'Balto': 'バルト',
    'Octrice': 'オクトリス',
    'Raio': 'ライオ',
    'Marwynn': 'マーウィン',
    'Izudia': 'エズディア',
    'Lishenna': 'リーシェナ',
    'Galmieux': 'ガルミーユ',
    'Rulenye & Valnereik': 'ルルナイ＆ヴァーナレク',
    'Axia': 'アクシア',
    'Himeka': 'ヒメカ',
    'Krulle': 'クルル',
    'Sham-Nacha': 'シャム＝ナクア',
    'Velharia': 'ヴェハリヤー',
    'Sinciro': 'シンセライズ',
    'Heirs': '継承者',
    'Norman': 'ノーマン',
    'Sarissa': 'サリッサ',
    'Reno': 'リノ',
    'Kit': 'キット',
    'Amalia': 'アマリア',
    'Bayle': 'ベイル',
    'Rusty': 'ラスティ',
    'Phildau': 'フィルドア',
    'Wards': '天宮',
    'Zwei': 'ツヴァイ',
    'Vier': 'フィア',
    'Salefa': 'サレファ',
    'Maeve': "ミーヴェ",
    'Yurius': 'ユリウス',
    'Neutral': "ニュートラル",
    "Forest": "エルフ",
    'Sword': "ロイヤル",
    'Rune': "ウィッチ",
    'Dragon': "ドラゴン",
    'Abyss': "ナイトメア",
    'Haven': "ビショップ",
    'Portal': "ネメシス",
    'ATK': "攻撃力",
    "Life": "体力",
    'Search cards...': 'カードを検索...',
    'Hide Filters': 'フィルターを隠す',
    'Show Filters': 'フィルターを表示',
    'Card Properties': 'カードプロパティ',
    'Rarity': 'レアリティ',
    'Type': 'タイプ',
    'Class': 'クラス',
    'Set': 'セット',
    'Token': 'トークン',
    'Stats': 'ステータス',
    'Cost': 'コスト',
    'ATK': '攻撃力',
    'LIFE': '体力',
    'Content & Creators': 'コンテンツとクリエイター',
    'Illustrator': 'イラストレーター',
    'CV': '声優',
    'Voices': 'ボイス',
    'Alternate Art': 'アルタネートアート',
    'Display & Sort': '表示とソート',
    'Sort by': 'ソート順',
    'Order': '順序',
    'View mode': '表示モード',
    'Reset All': 'すべてリセット',
    'Voice Lines': 'ボイスライン',
    'No voice lines available': 'ボイスがありません',
    'Show: Evo': '進化表示',
    'Show: Base': '基本表示',
    'Previous card': '前のカード',
    'Next card': '次のカード',
    'Close': '閉じる',
    'Back to top': 'トップに戻る',
    'Voice Language': 'ボイス言語',
    'UI Language': 'UI言語',
    'Download audio': '音声をダウンロード',
    'Play audio': '音声を再生',
    'Pause audio': '音声を一時停止',
    'Play': 'プレイ',
    'Attack': '攻撃',
    'Effect': 'エフェクト',
    'Death': '死',
    'Evolve': '進化',
    'Super-Evolve': '超進化',
    'Enhance': 'エンハンス',
    "Open Image": "画像をオープンする",
    "Download Image": "画像をダウンロード",
    'Any': 'すべて',
    'All cards': 'すべてのカード',
    'No tokens': 'トークンなし',
    'Tokens only': 'トークンのみ',
    'Both': '両方',
    'With voices': 'ボイスあり',
    'Without voices': 'ボイスなし',
    'With alternate art': 'カードスタイルあり',
    'Without alternate art': 'カードスタイルなし',
    'Alphabetical': 'アルファベット順',
    'Ascending': '昇順',
    'Descending': '降順',
    'List': 'リスト',
    'Waterfall': 'ウォーターフォール',
    'Full': 'フル',
    'min': '最小',
    'max': '最大',
    'Bronze': 'ブロンズ',
    'Silver': 'シルバー',
    'Gold': 'ゴールド',
    'Legendary': 'レジェンド',
    'Follower': 'フォロワー',
    'Amulet': 'アミュレット',
    'Spell': 'スペル',
    'Basic': 'ベーシック',
    'Legends Rise': '伝説の幕開',
    'Infinity Evolved': 'インフィニティ・エボルヴ',
    'Heirs of the Omen': '絶傑の継承者'
  }
};

function getLocalizedText(key) {
  const lang = isEnglishUI ? 'en' : 'jp';
  return localization[lang][key] || key;
}

function getLocalizedClassName(classId) {
  const className = classLabels[classId];
  return className ? getLocalizedText(className) : String(classId);
}

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function initializeLanguageFromUrl() {
  // First check URL parameter
  const langParam = getUrlParameter('lang');
  if (langParam === 'en') {
    isEnglishUI = true;
  } else if (langParam === 'jp') {
    isEnglishUI = false;
  } else {
    // If no URL param, check cookies
    const savedUILang = Settings.load('uiLanguage');
    if (savedUILang === 'en') {
      isEnglishUI = true;
    } else if (savedUILang === 'jp') {
      isEnglishUI = false;
    }
  }

  // Load voice language preference
  const savedVoiceLang = Settings.load('voiceLanguage');
  if (savedVoiceLang === 'en') {
    isEnglishVoice = true;
  } else if (savedVoiceLang === 'jp') {
    isEnglishVoice = false;
  }
}

function updateLocalization() {
  const elements = document.querySelectorAll('[data-en][data-jp]');
  elements.forEach(element => {
    const enText = element.getAttribute('data-en');
    const jpText = element.getAttribute('data-jp');
    if (enText && jpText) {
      element.textContent = isEnglishUI ? enText : jpText;
    }
  });

  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.placeholder = getLocalizedText('Search cards...');
  }

  const filterToggle = document.getElementById('filters-toggle-btn');
  if (filterToggle) {
    const isHidden = filterToggle.textContent.includes('Show') || filterToggle.textContent.includes('表示');
    filterToggle.textContent = isHidden ? getLocalizedText('Show Filters') : getLocalizedText('Hide Filters');
  }

  const optionsWithData = document.querySelectorAll('option[data-en][data-jp]');
  optionsWithData.forEach(option => {
    const enText = option.getAttribute('data-en');
    const jpText = option.getAttribute('data-jp');
    if (enText && jpText) {
      option.textContent = isEnglishUI ? enText : jpText;
    }
  });

  const openBtn = document.getElementById('lightbox-download');
  const downloadImgBtn = document.getElementById('lightbox-download-img');
  if (openBtn) openBtn.textContent = getLocalizedText('Open Image');
  if (downloadImgBtn) downloadImgBtn.textContent = getLocalizedText('Download Image');
  const voiceHint = document.querySelector('.lang-hint-text');
  if (voiceHint) voiceHint.textContent = getLocalizedText('Voice Language');

  const selectOptions = document.querySelectorAll('option:not([data-en])');
  selectOptions.forEach(option => {
    const key = option.textContent.trim();
    if (localization.en[key]) {
      option.textContent = getLocalizedText(key);
    }
  });

  const inputsWithData = document.querySelectorAll('input[data-en][data-jp]');
  inputsWithData.forEach(input => {
    const enText = input.getAttribute('data-en');
    const jpText = input.getAttribute('data-jp');
    if (enText && jpText) {
      input.placeholder = isEnglishUI ? enText : jpText;
    }
  });

  document.querySelectorAll('.audio-download-btn').forEach(btn => {
    btn.setAttribute('aria-label', getLocalizedText('Download audio'));
  });
  document.querySelectorAll('.audio-btn').forEach(btn => {
    const isPlaying = btn.classList.contains('playing');
    btn.setAttribute('aria-label', getLocalizedText(isPlaying ? 'Pause audio' : 'Play audio'));
  });

  const inputs = document.querySelectorAll('input[placeholder]:not([data-en])');
  inputs.forEach(input => {
    const key = input.placeholder.trim();
    if (localization.en[key]) {
      input.placeholder = getLocalizedText(key);
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function populateCVOptions() {
  const cvDatalist = document.getElementById("cv-options");
  if (!cvDatalist) return;

  const cacheKey = isEnglishVoice ? 'en' : 'jp';
  if (cvOptionsCache[cacheKey].size > 0 && cvOptionsPopulated) {
    cvDatalist.innerHTML = "";
    Array.from(cvOptionsCache[cacheKey])
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        cvDatalist.appendChild(opt);
      });
    return;
  }

  cvDatalist.innerHTML = "";
  const cvs = new Set();

  requestAnimationFrame(() => {
    Object.values(allCards).forEach((cardObj) => {
      const meta =
        (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const value = isEnglishVoice ? (meta.cv || "") : (meta.jpCV || "");
      if (value) {
        cvs.add(value);
        cvOptionsCache[cacheKey].add(value);
      }
    });

    Array.from(cvs)
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        cvDatalist.appendChild(opt);
      });

    cvOptionsPopulated = true;
  });
}

function populateIllustratorOptions() {
  const illuDatalist = document.getElementById("illustrator-options");
  if (!illuDatalist) return;

  const cacheKey = isEnglishUI ? 'en' : 'jp';
  if (illustratorOptionsCache[cacheKey].size > 0 && illustratorOptionsPopulated) {
    illuDatalist.innerHTML = "";
    Array.from(illustratorOptionsCache[cacheKey])
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        illuDatalist.appendChild(opt);
      });
    return;
  }

  illuDatalist.innerHTML = "";
  const illustrators = new Set();

  requestAnimationFrame(() => {
    Object.values(allCards).forEach((cardObj) => {
      const meta =
        (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const value = isEnglishUI ? meta.illustrator || "" : meta.jpIllustrator || "";
      if (value) {
        illustrators.add(value);
        illustratorOptionsCache[cacheKey].add(value);
      }
    });

    Array.from(illustrators)
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        illuDatalist.appendChild(opt);
      });

    illustratorOptionsPopulated = true;
  });
}

function createMobileDropdown(inputId, datalistId, placeholder) {
  const input = document.getElementById(inputId);
  const datalist = document.getElementById(datalistId);
  if (!input || !datalist) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (!isMobile) return;

  const existingBtn = input.parentNode.querySelector('.mobile-dropdown-btn');
  const existingMenu = input.parentNode.querySelector('.mobile-dropdown-menu');
  if (existingBtn) existingBtn.remove();
  if (existingMenu) existingMenu.remove();

  const dropdownBtn = document.createElement("button");
  dropdownBtn.type = "button";
  dropdownBtn.className = "mobile-dropdown-btn";
  dropdownBtn.style.position = "absolute";
  dropdownBtn.style.right = "8px";
  dropdownBtn.style.top = "50%"; b
  dropdownBtn.style.transform = "translateY(-50%)";
  dropdownBtn.style.background = "transparent";
  dropdownBtn.style.border = "none";
  dropdownBtn.style.padding = "4px";
  dropdownBtn.style.cursor = "pointer";
  dropdownBtn.style.pointerEvents = "auto";
  dropdownBtn.innerHTML = `
      <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 10l5 5 5-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

  const dropdownMenu = document.createElement("div");
  dropdownMenu.className = "mobile-dropdown-menu";
  dropdownMenu.style.display = "none";
  dropdownMenu.style.position = "absolute";
  dropdownMenu.style.top = "100%";
  dropdownMenu.style.left = "0";
  dropdownMenu.style.right = "0";
  dropdownMenu.style.zIndex = "1000";
  dropdownMenu.style.background = "var(--panel, #1e1e1e)";
  dropdownMenu.style.border = "1px solid var(--border, #444)";
  dropdownMenu.style.borderRadius = "6px";
  dropdownMenu.style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)";
  dropdownMenu.style.maxHeight = "200px";
  dropdownMenu.style.overflowY = "auto";

  const updateDropdownOptions = () => {
    const existingItems = dropdownMenu.querySelectorAll('.mobile-dropdown-item:not(.clear-item)');
    existingItems.forEach(item => item.remove());

    const options = Array.from(datalist.querySelectorAll("option"));
    const inputValue = input.value.toLowerCase();

    const filteredOptions = options.filter(option =>
      option.value.toLowerCase().includes(inputValue)
    );

    filteredOptions.forEach(option => {
      const menuItem = document.createElement("div");
      menuItem.className = "mobile-dropdown-item";
      menuItem.style.padding = "8px 12px";
      menuItem.style.cursor = "pointer";
      menuItem.style.borderBottom = "1px solid var(--border, #444)";
      menuItem.textContent = option.value;
      menuItem.addEventListener("click", () => {
        input.value = option.value;
        dropdownMenu.style.display = "none";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      menuItem.addEventListener("mouseenter", () => {
        menuItem.style.background = "rgba(255,255,255,0.08)";
      });
      menuItem.addEventListener("mouseleave", () => {
        menuItem.style.background = "transparent";
      });
      dropdownMenu.appendChild(menuItem);
    });
  };

  const clearItem = document.createElement("div");
  clearItem.className = "mobile-dropdown-item clear-item";
  clearItem.style.padding = "8px 12px";
  clearItem.style.cursor = "pointer";
  clearItem.style.borderBottom = "1px solid var(--border, #444)";
  clearItem.style.color = "var(--muted, #aaa)";
  clearItem.textContent = "Clear";
  clearItem.addEventListener("click", () => {
    input.value = "";
    dropdownMenu.style.display = "none";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  clearItem.addEventListener("mouseenter", () => {
    clearItem.style.background = "rgba(255,255,255,0.08)";
  });
  clearItem.addEventListener("mouseleave", () => {
    clearItem.style.background = "transparent";
  });
  dropdownMenu.appendChild(clearItem);

  dropdownBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropdownMenu.style.display === "none") {
      updateDropdownOptions();
      dropdownMenu.style.display = "block";
    } else {
      dropdownMenu.style.display = "none";
    }
  });

  input.addEventListener("focus", () => {
    if (input.value) {
      updateDropdownOptions();
      dropdownMenu.style.display = "block";
    }
  });

  input.addEventListener("input", (e) => {
    if (input.value) {
      updateDropdownOptions();
      dropdownMenu.style.display = "block";
    } else {
      dropdownMenu.style.display = "none";
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target) && !input.contains(e.target)) {
      dropdownMenu.style.display = "none";
    }
  });

  input.style.paddingRight = "40px";
  input.style.position = "relative";
  input.style.zIndex = "1";

  input.parentNode.appendChild(dropdownBtn);
  input.parentNode.appendChild(dropdownMenu);
}

function updateMobileDropdownMenu(inputId, datalistId) {
  const input = document.getElementById(inputId);
  const datalist = document.getElementById(datalistId);
  if (!input || !datalist) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (!isMobile) return;

  const dropdownContainer = input.parentNode.querySelector('.mobile-dropdown-container');
  if (!dropdownContainer) return;

  const dropdownMenu = dropdownContainer.querySelector('.mobile-dropdown-menu');
  if (!dropdownMenu) return;

}

const ENABLE_MANY_VOICES_FILTER = false;


// Load saved filters from cookies
const savedFilters = Settings.loadFilters();

const activeFilters = {
  rarity: savedFilters.rarity || "",
  costMin: savedFilters.costMin || "",
  costMax: savedFilters.costMax || "",
  cv: savedFilters.cv || "",
  illustrator: savedFilters.illustrator || "",
  atkMin: savedFilters.atkMin || "",
  atkMax: savedFilters.atkMax || "",
  lifeMin: savedFilters.lifeMin || "",
  lifeMax: savedFilters.lifeMax || "",
  class: savedFilters.class || "",
  set: savedFilters.set || "",
  type: savedFilters.type || "",
  tokenMode: savedFilters.tokenMode || "all",
  sortBy: savedFilters.sortBy || "alpha",
  sortOrder: savedFilters.sortOrder || "asc",
  voices: savedFilters.voices || "both",
  viewMode: savedFilters.viewMode || "list",
  groupBy: savedFilters.groupBy || "none",
  manyVoices: savedFilters.manyVoices || "all",
  alternate: savedFilters.alternate || "all",
};

// Save filters whenever they change
function saveCurrentFilters() {
  Settings.saveFilters(activeFilters);
}

const classLabels = {
  0: "Neutral",
  1: "Forest",
  2: "Sword",
  3: "Rune",
  4: "Dragon",
  5: "Abyss",
  6: "Haven",
  7: "Portal",
};

const classIconNames = {
  0: "neutral",
  1: "elf",
  2: "royal",
  3: "witch",
  4: "dragon",
  5: "nightmare",
  6: "bishop",
  7: "nemesis",
};

function getClassIconName(classNumber) {
  return classIconNames[classNumber] || "neutral";
}

function formatName(name) {
  return name.replace(/_/g, " ");
}

function createAudioButton(line) {
  const container = document.createElement("div");
  container.className = "audio-button-container";

  const isMeeting = line.label && line.label.startsWith("Meeting");
  const rawText = isMeeting
    ? line.label.substring(7)
    : (line.label || line.name);
  const displayText = localization.en[rawText]
    ? getLocalizedText(rawText)
    : rawText;

  const isMissing = isEnglishVoice ? !line.en_url : !line.url;

  const button = document.createElement(isMissing ? "div" : "button");
  button.className = isMeeting ? "audio-btn meeting-btn" : "audio-btn";
  if (!isMissing) {
    button.setAttribute("type", "button");
    button.setAttribute("aria-label", getLocalizedText('Play audio'));
  } else {
    button.classList.add("audio-unavailable");
    button.setAttribute("aria-disabled", "true");
  }
  button.innerHTML = isMissing
    ? `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg><span>${getLocalizedText('Not available')}</span>`
    : `
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path class="icon-play" d="M8 5v14l11-7-11-7z"/>
      <g class="icon-pause" style="display:none"><rect x="7" y="5" width="4" height="14" rx="1"></rect><rect x="13" y="5" width="4" height="14" rx="1"></rect></g>
    </svg>
    <span>${displayText}</span>
    <span class="time" aria-hidden="true">0:00</span>
  `;

  const downloadBtn = document.createElement(isMissing ? "div" : "button");
  downloadBtn.className = "audio-download-btn";
  if (!isMissing) {
    downloadBtn.setAttribute("type", "button");
    downloadBtn.setAttribute("aria-label", getLocalizedText('Download audio'));
  } else {
    downloadBtn.classList.add("audio-unavailable");
    downloadBtn.setAttribute("aria-disabled", "true");
  }
  downloadBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  if (!isMissing) button.addEventListener("click", () => {
    const isSame = currentButton === button;

    if (currentAudio && !isSame) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentButton) {
        currentButton.classList.remove("playing");
        toggleIcon(currentButton, false);
        const t = currentButton.querySelector(".time");
        if (t) t.textContent = "0:00";
      }
    }

    if (!currentAudio || !isSame) {
      if (isEnglishVoice == true) {
        currentAudio = new Audio(line.en_url);
      } else {
        currentAudio = new Audio(line.url);
      }
      const timeEl = button.querySelector(".time");
      const updateTime = () => {
        if (!currentAudio || !timeEl) return;
        const cur = formatTime(currentAudio.currentTime);
        const dur = isFinite(currentAudio.duration)
          ? formatTime(currentAudio.duration)
          : "…";
        timeEl.textContent = `${cur}/${dur}`;
      };
      currentAudio.addEventListener("ended", () => {
        if (currentButton) {
          currentButton.classList.remove("playing");
          toggleIcon(currentButton, false);
          const t2 = currentButton.querySelector(".time");
          if (t2) t2.textContent = "0:00";
        }
        currentAudio = null;
        currentButton = null;
        button.setAttribute("aria-label", getLocalizedText('Play audio'));
      });
      currentAudio.addEventListener("loadedmetadata", updateTime);
      currentAudio.addEventListener("timeupdate", updateTime);
      currentAudio.play();
      currentButton = button;
      button.classList.add("playing");
      toggleIcon(button, true);
      button.setAttribute("aria-label", getLocalizedText('Pause audio'));
      updateTime();
    } else {
      if (currentAudio.paused) {
        currentAudio.play();
        button.classList.add("playing");
        toggleIcon(button, true);
        button.setAttribute("aria-label", getLocalizedText('Pause audio'));
      } else {
        currentAudio.pause();
        button.classList.remove("playing");
        toggleIcon(button, false);
        button.setAttribute("aria-label", getLocalizedText('Play audio'));
      }
    }
  });

  if (!isMissing) downloadBtn.addEventListener("click", () => {
    const audioUrl = isEnglishVoice ? line.en_url : line.url;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${line.label || line.name || "audio"}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  container.appendChild(button);
  container.appendChild(downloadBtn);
  return container;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function toggleIcon(button, playing) {
  const svg = button.querySelector("svg");
  const playPath = svg.querySelector(".icon-play");
  const pauseGroup = svg.querySelector(".icon-pause");
  if (playing) {
    playPath.style.display = "none";
    pauseGroup.style.display = "block";
  } else {
    playPath.style.display = "block";
    pauseGroup.style.display = "none";
  }
}

let cvOptionsCache = { jp: new Set(), en: new Set() };
let cvOptionsPopulated = false;

let illustratorOptionsCache = { jp: new Set(), en: new Set() };
let illustratorOptionsPopulated = false;

const BATCH_SIZE = 200;
const HYDRATION_ROOT_MARGIN = "400px";
const IMAGE_ROOT_MARGIN = "600px";

let hydrateObserver = null;
let imageObserver = null;

function resetObservers() {
  if (hydrateObserver) {
    hydrateObserver.disconnect();
    hydrateObserver = null;
  }
  if (imageObserver) {
    imageObserver.disconnect();
    imageObserver = null;
  }
}

function createSkeletonCard(cardName, cardObj, cardIndex) {
  const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
  const cardDiv = document.createElement("div");
  cardDiv.className = "card skeleton";
  cardDiv.dataset.cardId = cardName;
  cardDiv.dataset.cardIndex = cardIndex;

  const header = document.createElement("div");
  header.className = "card-header";
  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = isEnglishUI ? formatName(cardName) : (meta.jpName || formatName(cardName));
  header.appendChild(title);

  if (meta.class !== undefined) {
    const classWrap = document.createElement("div");
    classWrap.className = "card-class-icon";
    classWrap.innerHTML = `<img src="Icons/class_${getClassIconName(meta.class)}.svg" alt="${getLocalizedClassName(meta.class)}" title="${getLocalizedClassName(meta.class)}">`;
    header.appendChild(classWrap);
  }

  cardDiv.appendChild(header);

  const imgWrap = document.createElement("div");
  imgWrap.className = "card-image placeholder";
  const img = document.createElement("img");
  img.alt = `${title.textContent} image`;
  img.loading = "lazy";
  const langSeg = isEnglishUI ? 'eng' : 'jpn';
  const baseHash = isEnglishUI ? (meta.card_image_hash || "") : (meta.jpCard_image_hash || meta.card_image_hash || "");
  if (baseHash) {
    const { commonUrl } = buildCardImageUrls(baseHash, null, langSeg) || {};
    if (commonUrl) img.dataset.src = commonUrl;
  }
  img.dataset.variant = "common";
  img.dataset.artType = "normal";
  imgWrap.appendChild(img);

  const metaWrap = document.createElement("div");
  metaWrap.className = "card-meta-slim";

  const enCV = meta.cv || "";
  const jpCV = meta.jpCV || "";



  cardDiv.appendChild(imgWrap);
  cardDiv.appendChild(metaWrap);

  return cardDiv;
}

function getShownNames(meta, altCv) {
  const jp = altCv || meta.jpCV || '';
  const en = altCv || meta.cv || '';
  if (isEnglishVoice && en) return splitCVs(en);
  if (!isEnglishVoice && jp) {
    const parts = splitCVs(jp);
    return isEnglishUI ? parts.map(p => getRomajiNameForJpCV(p) || p) : parts;
  }
  return [];
}

function renderCVMetadataContent(container, meta, altCv = '') {
  const shownNames = getShownNames(meta, altCv);
  if (shownNames.length === 0) return;

  const cvItem = document.createElement("div");
  cvItem.className = "card-metadata-item";

  const label = document.createElement("div");
  label.className = "card-metadata-label";
  label.textContent = getLocalizedText('CV');

  const valuesWrap = document.createElement("div");
  valuesWrap.style.display = "flex";
  valuesWrap.style.flexWrap = "wrap";
  valuesWrap.style.justifyContent = "center";
  valuesWrap.style.gap = "4px";

  shownNames.forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-metadata-value';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.padding = '0';
    btn.style.color = 'inherit';
    btn.style.cursor = 'pointer';
    btn.textContent = name;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCvDetailsModal(name);
    });
    valuesWrap.appendChild(btn);
  });

  cvItem.appendChild(label);
  cvItem.appendChild(valuesWrap);
  container.appendChild(cvItem);
}

function hydrateCard(skeletonEl) {
  if (!skeletonEl || skeletonEl.dataset.hydrated === "1") return;
  const cardId = skeletonEl.dataset.cardId;
  const cardObj = allCards[cardId];
  if (!cardObj) {
    skeletonEl.dataset.hydrated = "1";
    return;
  }

  skeletonEl.dataset.hydrated = "1";
  skeletonEl.classList.remove("skeleton");

  const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
  const metaEvo = (cardObj && cardObj.metadata && cardObj.metadata.evo) || {};
  const lines = Array.isArray(cardObj.voices) ? cardObj.voices : [];

  const header = skeletonEl.querySelector(".card-header") || document.createElement("div");
  header.className = "card-header";
  const title = header.querySelector(".card-title") || document.createElement("h2");
  title.className = "card-title";
  title.textContent = isEnglishUI ? formatName(cardId) : (meta.jpName || formatName(cardId));
  if (!header.contains(title)) header.appendChild(title);
  if (!skeletonEl.contains(header)) skeletonEl.insertBefore(header, skeletonEl.firstChild);

  const imgWrap = skeletonEl.querySelector(".card-image") || document.createElement("div");
  imgWrap.className = "card-image";
  const img = imgWrap.querySelector("img") || document.createElement("img");
  img.loading = "lazy";
  img.alt = `${title.textContent} image`;

  if (!img.dataset.src) {
    const langSeg = isEnglishUI ? 'eng' : 'jpn';
    const baseHash = isEnglishUI ? (meta.card_image_hash || "") : (meta.jpCard_image_hash || meta.card_image_hash || "");
    if (baseHash) {
      const { commonUrl } = buildCardImageUrls(baseHash, null, langSeg) || {};
      if (commonUrl) img.dataset.src = commonUrl;
    }
  }
  if (img.dataset.src && imageObserver) imageObserver.observe(img);

  // Attach click to open lightbox
  img.style.cursor = "zoom-in";
  img.addEventListener("click", () => {
    const cardIndex = filteredCards.findIndex(c => c && c.id === cardId);
    const lightboxDisplayName = isEnglishUI ? title.textContent : (meta.jpName || title.textContent);
    openLightbox({
      name: lightboxDisplayName,
      meta,
      metaEvo,
      voices: lines,
      alternate: cardObj.metadata?.alternate,
      cardIndex,
      cardData: filteredCards[cardIndex]
    });
  });

  const existingImgContent = skeletonEl.querySelector(".card-image-content");
  if (existingImgContent) existingImgContent.remove();

  if (activeFilters.viewMode === "list") {
    const imgContent = document.createElement("div");
    imgContent.className = "card-image-content";

    const leftMetadata = document.createElement("div");
    leftMetadata.className = "card-metadata";

    const rightMetadata = document.createElement("div");
    rightMetadata.className = "card-metadata";

    renderCVMetadataContent(leftMetadata, meta);

    const illustratorValueList = isEnglishUI
      ? meta.illustrator || ""
      : meta.jpIllustrator || meta.illustrator || "";
    if (illustratorValueList) {
      const illustratorItem = document.createElement("div");
      illustratorItem.className = "card-metadata-item";
      illustratorItem.innerHTML = `
        <div class="card-metadata-label">${getLocalizedText('Illustrator')}</div>
        <div class="card-metadata-value">${illustratorValueList}</div>
      `;
      rightMetadata.appendChild(illustratorItem);
    }

    imgContent.appendChild(leftMetadata);
    if (!imgWrap.contains(img)) imgWrap.appendChild(img);
    imgContent.appendChild(imgWrap);
    imgContent.appendChild(rightMetadata);
    skeletonEl.appendChild(imgContent);
  } else {
    if (!imgWrap.contains(img)) imgWrap.appendChild(img);
    if (!skeletonEl.contains(imgWrap)) skeletonEl.appendChild(imgWrap);
  }

  if (meta.skill_text && !skeletonEl.querySelector(".card-tooltip")) {
    imgWrap.style.position = "relative";

    const tooltip = document.createElement("div");
    tooltip.className = "card-tooltip";
    tooltip.innerHTML = isEnglishUI ? meta.skill_text : (meta.jpSkill_Text || meta.skill_text);
    tooltip.style.display = "none";
    imgWrap.appendChild(tooltip);

    const showTooltip = () => {
      tooltip.style.display = "block";
    };
    const hideTooltip = () => {
      tooltip.style.display = "none";
    };
    img.addEventListener("mousemove", (e) => {
      const rect = img.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = e.clientX + 10;
      let top = e.clientY - 10;

      if (left + tooltipRect.width > viewportWidth) {
        left = e.clientX - tooltipRect.width - 10;
      }
      if (top + tooltipRect.height > viewportHeight) {
        top = e.clientY - tooltipRect.height - 10;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) {
      const skillBtn = document.createElement("button");
      skillBtn.className = "card-skill-btn";
      skillBtn.setAttribute("aria-label", "Show card skills");
      skillBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm2 12h-4v-2h1v-4h-1v-2h3v6h1v2z" fill="currentColor"/>
        </svg>
      `;
      skillBtn.style.position = "absolute";
      skillBtn.style.top = "8px";
      skillBtn.style.right = "8px";
      skillBtn.style.zIndex = "60";

      let isVisible = false;
      skillBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isVisible) {
          hideTooltip();
          isVisible = false;
        } else {
          showTooltip();
          isVisible = true;
        }
      });

      // hide tooltip if tapping outside the card
      document.addEventListener("click", (e) => {
        if (isVisible && !imgWrap.contains(e.target)) {
          hideTooltip();
          isVisible = false;
        }
      });

      imgWrap.appendChild(skillBtn);
    } else {
      img.addEventListener("mouseenter", showTooltip);
      img.addEventListener("mouseleave", hideTooltip);
    }
  }

  const toggleContainer = document.createElement("div");
  toggleContainer.className = "img-toggle-container";

  const langSeg = isEnglishUI ? "eng" : "jpn";
  const baseHash = isEnglishUI
    ? meta.card_image_hash
    : meta.jpCard_image_hash || meta.card_image_hash;
  const evoHash = isEnglishUI
    ? metaEvo.card_image_hash
    : metaEvo.jpCard_image_hash || metaEvo.card_image_hash;

  const { commonUrl } = baseHash
    ? buildCardImageUrls(baseHash, null, langSeg)
    : { commonUrl: "" };
  const { commonUrl: evoUrl } = evoHash
    ? buildCardImageUrls(evoHash, null, langSeg)
    : { commonUrl: "" };

  const canToggleEvo = !!evoUrl;

  if (canToggleEvo) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "img-toggle";
    toggleBtn.type = "button";
    toggleBtn.setAttribute("aria-pressed", "false");
    toggleBtn.innerHTML = `<span>${getLocalizedText("Show: Evo")}</span>`;

    toggleBtn.addEventListener("click", () => {
      const isAlternate = img.dataset.artType === "alternate";
      const alternateData = cardObj.metadata?.alternate?.style_data;

      if (img.dataset.variant === "common") {
        if (isAlternate && alternateData?.evo_hash) {
          const altBase = `https://shadowverse-wb.com/uploads/card_image/${langSeg}/card/`;
          img.src = `${altBase}${alternateData.evo_hash}.png`;
        } else if (evoUrl) {
          img.src = evoUrl;
        }
        img.dataset.variant = "evo";
        toggleBtn.setAttribute("aria-pressed", "true");
        toggleBtn.innerHTML = `<span>${getLocalizedText("Show: Base")}</span>`;
      } else {
        if (isAlternate && alternateData?.hash) {
          const altBase = `https://shadowverse-wb.com/uploads/card_image/${langSeg}/card/`;
          img.src = `${altBase}${alternateData.hash}.png`;
        } else if (commonUrl) {
          img.src = commonUrl;
        }
        img.dataset.variant = "common";
        toggleBtn.setAttribute("aria-pressed", "false");
        toggleBtn.innerHTML = `<span>${getLocalizedText("Show: Evo")}</span>`;
      }

      updateVoiceButtonsOnCard(skeletonEl, cardObj);
    });

    toggleContainer.appendChild(toggleBtn);
  }

  imgWrap.appendChild(toggleContainer);





  if (cardObj.metadata?.alternate?.style_data && !skeletonEl.querySelector(".alternate-toggle")) {
    const alternateData = cardObj.metadata.alternate.style_data;
    const alternateToggle = document.createElement("button");
    alternateToggle.className = "alternate-toggle";
    alternateToggle.setAttribute("aria-label", "Toggle alternate art");
    alternateToggle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
    alternateToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isAlternate = img.dataset.artType === "alternate";
      if (isAlternate) {
        const commonUrl = img.dataset.srcCommon || img.dataset.src;
        if (commonUrl) img.src = commonUrl;
        img.dataset.artType = "normal";
        alternateToggle.classList.remove("active");
        updateCardMetadata(skeletonEl, meta, false);
      } else {
        if (alternateData?.hash) {
          const altUrl = `https://shadowverse-wb.com/uploads/card_image/eng/card/${alternateData.hash}.png`;
          img.src = altUrl;
          img.dataset.artType = "alternate";
          alternateToggle.classList.add("active");
          updateCardMetadata(skeletonEl, meta, true, alternateData);
        }
      }
      updateVoiceButtonsOnCard(skeletonEl, cardObj);
    });
    imgWrap.appendChild(alternateToggle);
  }

  // Voice buttons container
  if (!skeletonEl.querySelector(".voice-buttons-container")) {
    const voiceContainer = document.createElement("div");
    voiceContainer.className = "voice-buttons-container";
    skeletonEl.appendChild(voiceContainer);
  }
  updateVoiceButtonsOnCard(skeletonEl, cardObj);

  // Save filteredCards entry (use dataset.cardIndex)
  const entryIndex = Number(skeletonEl.dataset.cardIndex || -1);
  const cardDisplayName = isEnglishUI ? formatName(cardId) : (meta.jpName || formatName(cardId));
  filteredCards[entryIndex] = {
    id: cardId,
    name: cardDisplayName,
    meta,
    metaEvo,
    lines,
    alternate: cardObj.metadata?.alternate
  };
}
/**
 * Build or update voice buttons inside a card element.
 * This is used both at hydration time and whenever art toggles change.
 */
function updateVoiceButtonsOnCard(cardEl, cardObj) {
  const voiceButtonsContainer = cardEl.querySelector(".voice-buttons-container");
  if (!voiceButtonsContainer) return;
  voiceButtonsContainer.innerHTML = "";

  const isAlternate = cardEl.querySelector("img")?.dataset.artType === "alternate";
  const voicesToUse = isAlternate && cardObj.metadata?.alternate?.voices ? cardObj.metadata.alternate.voices : (Array.isArray(cardObj.voices) ? cardObj.voices : []);
  const row = document.createElement("div");
  row.className = "btn-row";

  if (Array.isArray(voicesToUse) && voicesToUse.length > 0) {
    voicesToUse.forEach(line => {
      const btn = createAudioButton(line);
      row.appendChild(btn);
    });
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "audio-btn audio-unavailable";
    placeholder.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">...</svg><span>${getLocalizedText('Not available')}</span>`;
    row.appendChild(placeholder);
  }
  voiceButtonsContainer.appendChild(row);
}

/**
 * Setup observers if not present:
 * - hydrateObserver: watches skeleton cards and hydrates them when near viewport
 * - imageObserver: watches images and sets `src` when near viewport
 */
function ensureObservers() {
  if (!hydrateObserver) {
    hydrateObserver = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          hydrateCard(ent.target);
          hydrateObserver.unobserve(ent.target);
        }
      });
    }, { root: null, rootMargin: HYDRATION_ROOT_MARGIN, threshold: 0.01 });
  }

  if (!imageObserver) {
    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          const img = ent.target;
          if (img.dataset.src) {
            // store common url for toggling fallback
            if (!img.dataset.srcCommon) img.dataset.srcCommon = img.dataset.src;
            img.src = img.dataset.src;
          }
          imageObserver.unobserve(img);
        }
      });
    }, { root: null, rootMargin: IMAGE_ROOT_MARGIN, threshold: 0.01 });
  }
}

/**
 * Replaces renderCards with optimized skeleton + hydration pipeline.
 * Accepts same params as your old renderCards(cards, filter)
 */
function renderCardsOptimized(cards, filter = "") {
  const container = document.getElementById("cards");
  if (!container) return;

  // reset
  resetObservers();
  ensureObservers();
  container.innerHTML = "";

  // Build entries, apply initial passesFilters (same as old function)
  let entries = Object.entries(cards);
  entries = entries.filter(([cardName, cardObj]) => passesFilters(cardObj.voices, cardObj.metadata?.common, cardObj));

  // If text filter present, apply it (keeps logic consistent with your previous code)
  if (filter) {
    const orGroups = filter.toLowerCase().split('|').map(g => g.trim()).filter(Boolean);
    entries = entries.filter(([cardName, cardObj]) => {
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const normalizedCardName = cardName.toLowerCase().replace(/_/g, ' ');
      const jpName = meta.jpName ? meta.jpName.toLowerCase() : '';
      const skillText = (meta.skill_text || '').toLowerCase();
      const jpSkillText = (meta.jpSkill_Text || '').toLowerCase();

      return orGroups.some(orGroup => {
        const andTerms = orGroup.split('&&').map(t => t.trim()).filter(Boolean);
        return andTerms.every(term => {
          if (term.startsWith('skill:')) {
            const skillTerm = term.substring(6).trim();
            if (!skillTerm) return true;
            if (skillTerm.startsWith('"') && skillTerm.endsWith('"')) {
              const strictSkillTerm = skillTerm.slice(1, -1);
              return skillText.includes(strictSkillTerm) || jpSkillText.includes(strictSkillTerm);
            } else {
              const words = skillTerm.split(" ");
              return words.every(word => skillText.includes(word) || jpSkillText.includes(word));
            }
          } else if (term.startsWith('atk:') || term.startsWith('life:') || term.startsWith('cost:')) {
            const parts = term.split(':');
            const statType = parts[0]; // 'atk', 'life', 'cost'
            const statQuery = parts[1]; // e.g., '>5', '<=3', '7'

            if (!statQuery) return true;

            const valueMatch = statQuery.match(/\d+/);
            const value = valueMatch ? Number(valueMatch[0]) : NaN;
            if (isNaN(value)) return false;

            const operator = statQuery.match(/[<>=!]+/)?.[0] || '=';
            const cardStat = Number(meta[statType]);

            switch (operator) {
              case '>': return cardStat > value;
              case '<': return cardStat < value;
              case '>=': return cardStat >= value;
              case '<=': return cardStat <= value;
              case '!=': return cardStat !== value;
              case '=':
              default: return cardStat === value;
            }
          } else if (term.startsWith('type:')) {
            const typeMap = {
              follower: 1,
              amulet: 2,
              spell: 4,
            };
            const typeTerm = term.substring(5).trim().toLowerCase();
            if (!typeTerm) return true;
            const matchedKey = Object.keys(typeMap).find(k => k.startsWith(typeTerm));
            return matchedKey ? meta.type === typeMap[matchedKey] : false;

          } else if (term.startsWith('class:')) {
            const classMap = {
              neutral: 0,
              forest: 1,
              sword: 2,
              rune: 3,
              dragon: 4,
              abyss: 5,
              haven: 6,
              portal: 7,
            };
            const classTerm = term.substring(6).trim().toLowerCase();
            if (!classTerm) return true;
            const matchedKey = Object.keys(classMap).find(k => k.startsWith(classTerm));
            return matchedKey ? meta.class === classMap[matchedKey] : false;

          } else if (term.startsWith('rarity:')) {
            const rarityMap = {
              bronze: 1,
              silver: 2,
              gold: 3,
              legendary: 4,
            };
            const rarityTerm = term.substring(7).trim().toLowerCase();
            if (!rarityTerm) return true;
            const matchedKey = Object.keys(rarityMap).find(k => k.startsWith(rarityTerm));
            return matchedKey ? meta.rarity === rarityMap[matchedKey] : false;

          } else {
            // Regular name search
            return normalizedCardName.includes(term) || jpName.includes(term);
          }
        });
      });
    });
  }

  // Sorting (keep your original sort logic)
  entries.sort((a, b) => {
    const [nameA, objA] = a;
    const [nameB, objB] = b;
    const metaA = (objA && objA.metadata && objA.metadata.common) || {};
    const metaB = (objB && objB.metadata && objB.metadata.common) || {};
    let result;
    switch (activeFilters.sortBy) {
      case "cost": result = (metaA.cost ?? 0) - (metaB.cost ?? 0) || nameA.localeCompare(nameB); break;
      case "atk": result = (metaA.atk ?? 0) - (metaB.atk ?? 0) || nameA.localeCompare(nameB); break;
      case "life": result = (metaA.life ?? 0) - (metaB.life ?? 0) || nameA.localeCompare(nameB); break;
      case "class": result = (metaA.class ?? 0) - (metaB.class ?? 0) || nameA.localeCompare(nameB); break;
      case "rarity": result = (metaA.rarity ?? 0) - (metaB.rarity ?? 0) || nameA.localeCompare(nameB); break;
      case "alpha":
      default: result = nameA.localeCompare(nameB); break;
    }
    return activeFilters.sortOrder === "desc" ? -result : result;
  });

  // grouping - if groupBy is set, we still create skeletons but will insert group headers
  const groupBy = activeFilters.groupBy;
  let grouped = null;
  if (groupBy !== "none") {
    grouped = new Map();
    entries.forEach(([cardName, cardObj]) => {
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const key = groupBy === "illustrator"
        ? (isEnglishUI ? meta.illustrator : (meta.jpIllustrator || meta.illustrator))
        : (isEnglishVoice ? meta.cv : (meta.jpCV || meta.cv));
      const fallback = groupBy === "illustrator" ? getLocalizedText("No Illustrator Data") : getLocalizedText("No CV Data");
      const groupKey = key && key.trim() ? key.trim() : fallback;
      if (!grouped.has(groupKey)) grouped.set(groupKey, []);
      grouped.get(groupKey).push([cardName, cardObj]);
    });
    grouped = new Map(Array.from(grouped.entries()).sort((a, b) => {
      const isAFallback = a[0].startsWith("No ");
      const isBFallback = b[0].startsWith("No ");
      if (isAFallback && !isBFallback) return 1;
      if (!isAFallback && isBFallback) return -1;
      return a[0].localeCompare(b[0]);
    }));
  }

  // Reset filteredCards array to expected length (so navigation indices are stable)
  filteredCards = new Array(entries.length);

  // Create a fragment and progressively add skeleton cards in batches
  const fragment = document.createDocumentFragment();
  const groups = grouped ? Array.from(grouped.entries()) : null;
  let jobList = [];

  if (grouped) {
    groups.forEach(([groupKey, list]) => {
      jobList.push({ type: "groupHeader", groupKey });
      list.forEach((entry) => jobList.push({ type: "card", entry }));
    });
  } else {
    entries.forEach(entry => jobList.push({ type: "card", entry }));
  }

  let idx = 0;
  function step() {
    const end = Math.min(idx + BATCH_SIZE, jobList.length);
    for (; idx < end; idx++) {
      const job = jobList[idx];
      if (job.type === "groupHeader") {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.textContent = job.groupKey;
        fragment.appendChild(groupHeader);
      } else if (job.type === "card") {
        const [cardName, cardObj] = job.entry;
        const skeleton = createSkeletonCard(cardName, cardObj, fragment.childElementCount);
        fragment.appendChild(skeleton);

        // Observe skeleton for hydration
        hydrateObserver.observe(skeleton);

        // Observe image if a data-src exists
        const pendingImg = skeleton.querySelector("img[data-src]");
        if (pendingImg && imageObserver) imageObserver.observe(pendingImg);
      }
    }


    if (idx < jobList.length) {
      requestAnimationFrame(step);
    } else {
      container.appendChild(fragment);
      if (activeFilters.viewMode === "waterfall") {
        applyMasonryLayout(container);
      }
    }
  }

  requestAnimationFrame(step);
}

// Replace existing renderCards with new optimized one
// If some code references renderCards by name, alias it:
const renderCards = renderCardsOptimized;


function applyMasonryLayout(container) {
  // Get all cards and group headers
  const allElements = Array.from(container.children);
  const cards = allElements.filter(el => el.classList.contains('card'));
  const groupHeaders = allElements.filter(el => el.classList.contains('group-header'));

  if (cards.length === 0) return;

  // Get the number of columns based on screen width
  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
  };

  const columnCount = getColumnCount();

  // If only one column, no masonry needed
  if (columnCount === 1) return;

  // Create masonry columns
  const columns = Array.from({ length: columnCount }, () => []);
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  // Distribute cards to columns (horizontal-first flow)
  cards.forEach((card, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(card);
  });

  // Clear container
  container.innerHTML = '';

  // Rebuild container with masonry layout
  let cardIndex = 0;

  if (groupHeaders.length > 0) {
    // Handle grouped layout
    allElements.forEach(el => {
      if (el.classList.contains('group-header')) {
        container.appendChild(el);
      } else if (el.classList.contains('card')) {
        if (cardIndex < cards.length) {
          const columnIndex = cardIndex % columnCount;
          container.appendChild(cards[cardIndex]);
          cardIndex++;
        }
      }
    });
  } else {
    // Handle non-grouped layout - create columns
    const columnContainers = Array.from({ length: columnCount }, () => {
      const col = document.createElement('div');
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.gap = '16px';
      col.style.flex = '1';
      return col;
    });

    // Distribute cards to columns
    cards.forEach((card, index) => {
      const columnIndex = index % columnCount;
      columnContainers[columnIndex].appendChild(card);
    });

    // Create flex container for columns
    const flexContainer = document.createElement('div');
    flexContainer.style.display = 'flex';
    flexContainer.style.gap = '16px';
    flexContainer.style.alignItems = 'flex-start';

    columnContainers.forEach(col => flexContainer.appendChild(col));
    container.appendChild(flexContainer);
  }
}

function passesFilters(lines, meta, cardData = null) {
  // Guard against missing metadata
  meta = meta || {};
  lines = Array.isArray(lines) ? lines : [];

  if (activeFilters.rarity && Number(meta.rarity) !== Number(activeFilters.rarity)) {
    return false;
  }

  const cost = Number(meta.cost) || 0;
  const atk = Number(meta.atk) || 0;
  const life = Number(meta.life) || 0;
  const classNum = Number(meta.class);
  const typeNum = Number(meta.type);
  const setNum = Number(meta.card_set_id);

  if (activeFilters.costMin !== "" && cost < Number(activeFilters.costMin)) return false;
  if (activeFilters.costMax !== "" && cost > Number(activeFilters.costMax)) return false;
  if (activeFilters.atkMin !== "" && atk < Number(activeFilters.atkMin)) return false;
  if (activeFilters.atkMax !== "" && atk > Number(activeFilters.atkMax)) return false;
  if (activeFilters.lifeMin !== "" && life < Number(activeFilters.lifeMin)) return false;
  if (activeFilters.lifeMax !== "" && life > Number(activeFilters.lifeMax)) return false;

  if (activeFilters.cv) {
    const filterCV = activeFilters.cv.trim().toLowerCase();
    const enParts = splitCVs(meta.cv || "");
    const jpParts = splitCVs(meta.jpCV || "");
    const romajiParts = jpParts.map(p => getRomajiNameForJpCV(p)).filter(Boolean);
    const candidates = [...enParts, ...jpParts, ...romajiParts].filter(Boolean).map(s => s.toLowerCase());
    const matched = candidates.some(name => name.includes(filterCV));
    if (!matched) return false;
  }
  if (activeFilters.illustrator) {
    const illustrator = isEnglishUI
      ? (meta.illustrator || "")
      : (meta.jpIllustrator || meta.illustrator || "");
    const filterIllustrator = activeFilters.illustrator.trim();
    if (!illustrator.toLowerCase().includes(filterIllustrator.toLowerCase())) return false;
  }

  if (activeFilters.type) {
    if (activeFilters.type === "amulet") {
      if (!(typeNum === 2 || typeNum === 3)) return false;
    } else {
      if (typeNum !== Number(activeFilters.type)) return false;
    }
  }
  if (activeFilters.class !== "" && classNum !== Number(activeFilters.class)) {
    return false;
  }
  if (activeFilters.set !== "" && setNum !== Number(activeFilters.set)) {
    return false;
  }
  if (activeFilters.tokenMode === "exclude") {
    if (meta.is_token) return false;
  } else if (activeFilters.tokenMode === "only") {
    if (!meta.is_token) return false;
  }
  if (activeFilters.voices === "with") {
    if (!Array.isArray(lines) || lines.length === 0) return false;
  } else if (activeFilters.voices === "without") {
    if (Array.isArray(lines) && lines.length > 0) return false;
  }

  if (ENABLE_MANY_VOICES_FILTER && activeFilters.manyVoices !== "all") {
    const voiceCount = Array.isArray(lines) ? lines.length : 0;
    if (activeFilters.manyVoices === "many") {
      if (voiceCount < 6) return false;
    } else if (activeFilters.manyVoices === "few") {
      if (voiceCount >= 5) return false;
    }
  }

  if (activeFilters.alternate !== "all") {
    const hasAlternate =
      cardData &&
      cardData.metadata &&
      cardData.metadata.alternate &&
      cardData.metadata.alternate.style_data;
    if (activeFilters.alternate === "with") {
      if (!hasAlternate) return false;
    } else if (activeFilters.alternate === "without") {
      if (hasAlternate) return false;
    }
  }

  return true;
}

function buildCardImageUrls(cardImageHash, evoCardImageHash, langSegment = 'eng') {
  const base = `https://shadowverse-wb.com/uploads/card_image/${langSegment}`;
  return {
    commonUrl: cardImageHash ? `${base}/card/${cardImageHash}.png` : '',
    evoUrl: evoCardImageHash ? `${base}/card/${evoCardImageHash}.png` : '',
  };
}

function updateCardMetadata(cardDiv, meta, isAlternate, alternateData = null) {
  if (activeFilters.viewMode !== "list") return;

  const leftMetadata = cardDiv.querySelector(".card-metadata");
  const rightMetadata = cardDiv.querySelectorAll(".card-metadata")[1];

  if (!leftMetadata || !rightMetadata) return;

  leftMetadata.innerHTML = "";
  rightMetadata.innerHTML = "";

  const altCv = isAlternate && alternateData?.cv ? alternateData.cv : '';
  renderCVMetadataContent(leftMetadata, meta, altCv);

  const illustratorValue =
    isAlternate
      ? (alternateData?.illustrator || "")
      : isEnglishUI
        ? meta.illustrator || ""
        : meta.jpIllustrator || meta.illustrator || "";

  if (illustratorValue) {
    const illustratorItem = document.createElement("div");
    illustratorItem.className = "card-metadata-item";
    illustratorItem.innerHTML = `
      <div class="card-metadata-label">${getLocalizedText('Illustrator')}</div>
      <div class="card-metadata-value">${illustratorValue}</div>
    `;
    rightMetadata.appendChild(illustratorItem);
  }
}

function updateOpenLightboxVoiceLanguage() {
  const lb = document.getElementById("lightbox");
  if (!lb || !lb.classList.contains("open")) return;

  if (currentCardIndex < 0 || !filteredCards[currentCardIndex]) return;
  const cardData = filteredCards[currentCardIndex];
  const cardObj = allCards[cardData.id];
  if (!cardObj) return;


  const currentImg = document.getElementById("lightbox-img");
  const isEvo = currentImg.dataset.variant === "evo";

  const voicesList = document.getElementById("lightbox-voices-list");
  if (voicesList) {
    const altToggle = document.getElementById("lightbox-alternate-toggle");
    const isAltMode = altToggle && altToggle.classList.contains("active");

    const voices = cardObj.voices || [];
    const altVoices = cardObj.metadata?.alternate?.voices || [];

    const voicesToUse = isAltMode ? altVoices : voices;

    voicesList.innerHTML = "";
    if (voicesToUse && voicesToUse.length > 7) {
      voicesList.parentElement.classList.add("many-voices");
    } else {
      voicesList.parentElement.classList.remove("many-voices");
    }

    if (voicesToUse && voicesToUse.length > 0) {
      voicesToUse.forEach(line => {
        const voiceContainer = document.createElement("div");
        voiceContainer.className = "lightbox-voice-container";

        const isMeeting = line.label && line.label.startsWith("Meeting");
        const rawText = isMeeting
          ? line.label.substring(7)
          : (line.label || line.name || line);


        const displayText = localization.en[rawText]
          ? getLocalizedText(rawText)
          : rawText;

        const btn = createAudioButton(line);

      });
    }


    const nextDisplayName = isEnglishUI ? cardData.name : (cardData.meta.jpName || cardData.name);
    openLightbox({
      name: nextDisplayName,
      meta: cardData.meta,
      metaEvo: cardData.metaEvo,
      voices: cardData.lines,
      alternate: cardData.alternate,
      cardIndex: currentCardIndex,
      cardData: cardData
    });
  }
}

function updateAllCardsForLanguage() {
  const cards = document.querySelectorAll('.card[data-hydrated="1"]');
  cards.forEach(cardEl => {
    const cardId = cardEl.dataset.cardId;
    const cardObj = allCards[cardId];
    if (!cardObj) return;

    const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};

    // Update Card Names
    const title = cardEl.querySelector(".card-title");
    if (title) {
      title.textContent = isEnglishUI ? formatName(cardId) : (meta.jpName || formatName(cardId));
    }

    // Update Class Icons (title/alt)
    if (meta.class !== undefined) {
      const classImg = cardEl.querySelector(".card-class-icon img");
      if (classImg) {
        const locName = getLocalizedClassName(meta.class);
        classImg.alt = locName;
        classImg.title = locName;
      }
    }

    // Update Tooltips
    const tooltip = cardEl.querySelector(".card-tooltip");
    if (tooltip) {
      tooltip.innerHTML = isEnglishUI ? meta.skill_text : (meta.jpSkill_Text || meta.skill_text);
    }

    updateVoiceButtonsOnCard(cardEl, cardObj);

    // Update Toggle Buttons
    const toggleBtn = cardEl.querySelector(".img-toggle span");
    if (toggleBtn) {
      // Determine current state
      const img = cardEl.querySelector("img");
      const isEvo = img && img.dataset.variant === "evo";
      // If isEvo, button says "Show: Base"
      toggleBtn.textContent = getLocalizedText(isEvo ? "Show: Base" : "Show: Evo");
    }

    const leftMetadata = cardEl.querySelector(".card-metadata");
    const rightMetadata = cardEl.querySelectorAll(".card-metadata")[1];
    if (leftMetadata && rightMetadata) {
      leftMetadata.innerHTML = "";
      rightMetadata.innerHTML = "";

      const img = cardEl.querySelector("img");
      const isAlt = img && img.dataset.artType === "alternate";
      const altCv = isAlt && cardObj.metadata?.alternate?.style_data?.cv;

      renderCVMetadataContent(leftMetadata, meta, altCv);

      const alternateData = cardObj.metadata?.alternate?.style_data;
      const illustratorValue =
        isAlt
          ? (alternateData?.illustrator || "")
          : isEnglishUI
            ? meta.illustrator || ""
            : meta.jpIllustrator || meta.illustrator || "";

      if (illustratorValue) {
        const illustratorItem = document.createElement("div");
        illustratorItem.className = "card-metadata-item";
        illustratorItem.innerHTML = `
              <div class="card-metadata-label">${getLocalizedText('Illustrator')}</div>
              <div class="card-metadata-value">${illustratorValue}</div>
            `;
        rightMetadata.appendChild(illustratorItem);
      }
    }
    const entryIndex = Number(cardEl.dataset.cardIndex || -1);
    if (entryIndex >= 0 && filteredCards[entryIndex]) {
      filteredCards[entryIndex].name = isEnglishUI ? formatName(cardId) : (meta.jpName || formatName(cardId));
    }
  });

  updateOpenLightboxVoiceLanguage();
}

function updateLightboxMetadata(
  meta,
  metaEvo,
  isAlternate,
  alternateData = null,
  showing = "common"
) {
  const metaBox = document.getElementById("lightbox-meta");
  const flavor = document.getElementById("lightbox-flavor");

  if (!metaBox || !flavor) return;

  metaBox.innerHTML = "";

  const cvValue =
    isAlternate && alternateData?.cv
      ? alternateData.cv
      : isEnglishVoice
        ? meta.cv || ""
        : meta.jpCV || "";

  const illustratorValue =
    isAlternate
      ? (alternateData?.illustrator || "")
      : (isEnglishUI ? (meta.illustrator || "") : (meta.jpIllustrator || meta.illustrator || ""));

  if (cvValue) {
    const cvItem = document.createElement("div");
    cvItem.innerHTML = `
      <div class="label">${getLocalizedText('CV')}</div>
      <div class="value">${cvValue}</div>
    `;
    metaBox.appendChild(cvItem);
  }

  if (illustratorValue) {
    const illustratorItem = document.createElement("div");
    illustratorItem.innerHTML = `
      <div class="label">${getLocalizedText('Illustrator')}</div>
      <div class="value">${illustratorValue}</div>
    `;
    metaBox.appendChild(illustratorItem);
  }

  if (
    isAlternate &&
    alternateData?.evo_flavour_text &&
    showing === "evo"
  ) {
    flavor.innerHTML = alternateData.evo_flavour_text;
  } else if (isAlternate && alternateData?.flavour_text) {
    flavor.innerHTML = alternateData.flavour_text;
  } else {
    if (showing === "evo" && metaEvo?.flavour_text) {
      const jpEvoFlavor = metaEvo.jpFlavour_text;
      const flavorText = isEnglishUI ? metaEvo.flavour_text : jpEvoFlavor;
      flavor.innerHTML = flavorText || "";
    } else {
      const jpFlavor = meta.jpFlavour_Text;
      const flavorText = isEnglishUI ? meta.flavour_text : (jpFlavor || meta.flavour_text);
      flavor.innerHTML = flavorText || "";
    }
  }
}

function openLightbox({ name, meta, metaEvo, voices = [], alternate = null, cardIndex = -1, cardData = null }) {
  if (window.resetLightboxZoom) window.resetLightboxZoom();
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const metaBox = document.getElementById("lightbox-meta");
  const flavor = document.getElementById("lightbox-flavor");
  const voicesContainer = document.getElementById("lightbox-voices-list");
  const toggle = document.getElementById("lightbox-toggle");
  const openBtn = document.getElementById("lightbox-download");
  const downloadImgBtn = document.getElementById("lightbox-download-img");
  const lightboxControls = document.querySelector(".lightbox-controls");
  if (openBtn) openBtn.textContent = getLocalizedText('Open Image');
  if (downloadImgBtn) downloadImgBtn.textContent = getLocalizedText('Download Image');
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  const lightboxContent = document.querySelector('.lightbox-content');
  if (lightboxContent) {
    lightboxContent.classList.remove('swipe-left', 'swipe-right');

    // Add or update credit text
    let creditEl = lightboxContent.querySelector('.lightbox-credit');
    if (!creditEl) {
      creditEl = document.createElement('div');
      creditEl.className = 'lightbox-credit';
      creditEl.textContent = 'Full art by Xtopher17';
      lightboxContent.appendChild(creditEl);
    }
  }

  currentCardIndex = cardIndex;
  currentCardData = cardData;

  if (prevBtn && nextBtn) {
    prevBtn.disabled = currentCardIndex <= 0;
    nextBtn.disabled = currentCardIndex >= filteredCards.length - 1;
  }

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 50;

  const handleSwipe = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      const lightboxContent = document.querySelector('.lightbox-content');

      if (deltaX > 0) {
        if (currentCardIndex > 0) {
          lightboxContent.classList.add('swipe-right');

          setTimeout(() => {
            const prevCardData = filteredCards[currentCardIndex - 1];
            const prevCardObj = allCards[prevCardData.id];
            if (prevCardObj) {
              const prevMeta = prevCardObj.metadata?.common || {};
              const prevMetaEvo = prevCardObj.metadata?.evo || {};
              const prevLines = prevCardObj.voices || [];
              const prevAlternate = prevCardObj.metadata?.alternate || null;

              const prevDisplayName = isEnglishUI ? prevCardData.name : (prevMeta.jpName || prevCardData.name);
              openLightbox({
                name: prevDisplayName,
                meta: prevMeta,
                metaEvo: prevMetaEvo,
                voices: prevLines,
                alternate: prevAlternate,
                cardIndex: currentCardIndex - 1,
                cardData: prevCardData
              });
            }
          }, 150);
        }
      } else {
        if (currentCardIndex < filteredCards.length - 1) {
          lightboxContent.classList.add('swipe-left');

          setTimeout(() => {
            const nextCardData = filteredCards[currentCardIndex + 1];
            const nextCardObj = allCards[nextCardData.id];
            if (nextCardObj) {
              const nextMeta = nextCardObj.metadata?.common || {};
              const nextMetaEvo = nextCardObj.metadata?.evo || {};
              const nextLines = nextCardObj.voices || [];
              const nextAlternate = nextCardObj.metadata?.alternate || null;

              const nextDisplayName = isEnglishUI ? nextCardData.name : (nextMeta.jpName || nextCardData.name);
              openLightbox({
                name: nextDisplayName,
                meta: nextMeta,
                metaEvo: nextMetaEvo,
                voices: nextLines,
                alternate: nextAlternate,
                cardIndex: currentCardIndex + 1,
                cardData: nextCardData
              });
            }
          }, 150);
        }
      }
    }
  };

  if (isMobile) {
    if (window.cleanupLightboxTouchEvents) {
      window.cleanupLightboxTouchEvents();
    }

    const touchStartHandler = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const touchMoveHandler = (e) => {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX;
      const deltaY = currentY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > 20) {
        const lightboxContent = document.querySelector('.lightbox-content');

        lightboxContent.classList.remove('swipe-preview-left', 'swipe-preview-right');

        if (deltaX > 0 && currentCardIndex > 0) {
          lightboxContent.classList.add('swipe-preview-right');
        } else if (deltaX < 0 && currentCardIndex < filteredCards.length - 1) {
          lightboxContent.classList.add('swipe-preview-left');
        }
      }
    };

    const touchEndHandler = (e) => {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;

      const lightboxContent = document.querySelector('.lightbox-content');
      lightboxContent.classList.remove('swipe-preview-left', 'swipe-preview-right');

      handleSwipe();
    };

    lb.addEventListener("touchstart", touchStartHandler, { passive: true });
    lb.addEventListener("touchmove", touchMoveHandler, { passive: true });
    lb.addEventListener("touchend", touchEndHandler, { passive: true });

    window.currentTouchStartHandler = touchStartHandler;
    window.currentTouchMoveHandler = touchMoveHandler;
    window.currentTouchEndHandler = touchEndHandler;
  }

  let alternateToggle = document.getElementById("lightbox-alternate-toggle");
  if (alternateToggle) {
    alternateToggle.textContent = "Show: Alternate";
    alternateToggle.style.display = "none";
  }

  const langSegLb = isEnglishUI ? 'eng' : 'jpn';
  const jpCommonHash = meta.jp_card_image_hash || meta.jpCard_image_hash;
  const lbCommonHash = isEnglishUI ? meta.card_image_hash : (jpCommonHash || meta.card_image_hash);
  const commonUrl =
    meta?.base_art_url ||
    (lbCommonHash ? `https://shadowverse-wb.com/uploads/card_image/${langSegLb}/card/${lbCommonHash}.png` : "");
  const evoUrl =
    metaEvo?.evo_art_url ||
    (() => {
      const jpEvoHashLb = metaEvo?.jp_card_image_hash || metaEvo?.jpCard_image_hash;
      const evoHashLb = isEnglishUI ? metaEvo?.card_image_hash : (jpEvoHashLb || metaEvo?.card_image_hash);
      return evoHashLb ? `https://shadowverse-wb.com/uploads/card_image/${langSegLb}/card/${evoHashLb}.png` : commonUrl;
    })();

  let showing = "common";
  img.src = commonUrl;
  const lightboxTitleName = isEnglishUI ? name : (meta.jpName || name);
  title.textContent = lightboxTitleName;
  metaBox.innerHTML = "";

  updateLightboxMetadata(meta, metaEvo, false, null, "common");


  let showingAlternate = false;

  const updateLightboxVoices = () => {
    voicesContainer.innerHTML = "";
    const voicesToUse =
      showingAlternate && alternate?.voices ? alternate.voices : voices;

    if (voicesToUse && voicesToUse.length > 7) {
      voicesContainer.classList.add("many-voices");
    } else {
      voicesContainer.classList.remove("many-voices");
    }

    if (voicesToUse && voicesToUse.length > 0) {
      voicesToUse.forEach((line, index) => {
        const voiceContainer = document.createElement("div");
        voiceContainer.className = "lightbox-voice-container";

        const isMeeting = line.label && line.label.startsWith("Meeting");
        const rawText = isMeeting
          ? line.label.substring(7)
          : (line.label || line.name || line);
        const displayText = localization.en[rawText]
          ? getLocalizedText(rawText)
          : rawText;

        const voiceBtn = document.createElement("button");
        voiceBtn.className = isMeeting
          ? "lightbox-voice-btn meeting-btn"
          : "lightbox-voice-btn";
        voiceBtn.innerHTML = `
        <svg class="voice-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="voice-text">${displayText}</span>
        <span class="voice-duration">--:--</span>
      `;

        const downloadBtn = document.createElement("button");
        downloadBtn.className = "lightbox-download-btn";
        downloadBtn.setAttribute("aria-label", getLocalizedText('Download audio'));
        downloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

        voiceBtn.addEventListener("click", () => {
          if (currentAudio) {
            currentAudio.pause();
            if (currentButton) {
              currentButton.classList.remove("playing");
              currentButton.querySelector(".voice-icon").innerHTML = `
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
            }
          }

          if (currentButton === voiceBtn && currentAudio) {
            currentButton = null;
            currentAudio = null;
            return;
          }

          const audioUrl = isEnglishVoice ? line.en_url : line.url;
          const audio = new Audio(audioUrl);
          currentAudio = audio;
          currentButton = voiceBtn;

          voiceBtn.classList.add("playing");
          voiceBtn.querySelector(".voice-icon").innerHTML = `
          <path d="M6 4h4v16H6zM14 4h4v16h-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;

          audio.addEventListener("loadedmetadata", () => {
            const duration = formatTime(audio.duration);
            voiceBtn.querySelector(".voice-duration").textContent = duration;
          });

          audio.addEventListener("timeupdate", () => {
            const current = formatTime(audio.currentTime);
            const duration = formatTime(audio.duration);
            voiceBtn.querySelector(
              ".voice-duration"
            ).textContent = `${current} / ${duration}`;
          });

          audio.addEventListener("ended", () => {
            voiceBtn.classList.remove("playing");
            voiceBtn.querySelector(".voice-icon").innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          `;
            const duration = formatTime(audio.duration);
            voiceBtn.querySelector(".voice-duration").textContent = duration;
            currentButton = null;
            currentAudio = null;
          });

          audio.play().catch(console.error);
        });

        downloadBtn.addEventListener("click", () => {
          const audioUrl = isEnglishVoice ? line.en_url : line.url;
          const link = document.createElement("a");
          link.href = audioUrl;
          link.download = `${line.label || line.name || "audio"}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

        voiceContainer.appendChild(voiceBtn);
        voiceContainer.appendChild(downloadBtn);
        voicesContainer.appendChild(voiceContainer);
      });
    } else {
      voicesContainer.innerHTML =
        `<div style="color: var(--muted); font-style: italic; text-align: center; padding: 20px;">${getLocalizedText('No voice lines available')}</div>`;
    }
  };

  updateLightboxVoices();



  {
    const canToggleEvo = Number(meta.type) === 1 && !!evoUrl;
    if (toggle) {
      if (canToggleEvo) {
        toggle.style.display = "";
        toggle.textContent = getLocalizedText('Show: Evo');
        toggle.onclick = () => {
          if (showing === "common") {
            if (showingAlternate && alternate?.style_data?.evo_art_url) {
              img.src = alternate.style_data.evo_art_url;
            } else {
              img.src = evoUrl;
            }
            showing = "evo";
            toggle.textContent = getLocalizedText('Show: Base');

            updateLightboxMetadata(
              meta,
              metaEvo,
              showingAlternate,
              showingAlternate ? alternate?.style_data : null,
              "evo"
            );
          } else {
            if (showingAlternate && alternate?.style_data?.base_art_url) {
              img.src = alternate.style_data.base_art_url;
            } else {
              img.src = commonUrl;
            }
            showing = "common";
            toggle.textContent = getLocalizedText('Show: Evo');

            updateLightboxMetadata(
              meta,
              metaEvo,
              showingAlternate,
              showingAlternate ? alternate?.style_data : null,
              "common"
            );
          }

          updateLightboxVoices();
        };
      } else {
        toggle.style.display = "none";
      }
    }
  }


  if (alternate?.style_data) {
    if (!alternateToggle) {
      alternateToggle = document.createElement("button");
      alternateToggle.id = "lightbox-alternate-toggle";
      alternateToggle.className = "lightbox-btn";
      alternateToggle.type = "button";
      alternateToggle.innerHTML = "Show: Alternate";
      lightboxControls.appendChild(alternateToggle);
    }

    alternateToggle.style.display = "";

    alternateToggle.onclick = () => {
      if (showingAlternate) {
        if (showing === "evo") {
          img.src = evoUrl;
        } else {
          img.src = commonUrl;
        }
        alternateToggle.textContent = "Show: Alternate";
        showingAlternate = false;
        const normalTitleName = isEnglishUI ? name : (meta.jpName || name);
        title.textContent = normalTitleName;

        updateLightboxMetadata(meta, metaEvo, false, null, showing);
      } else {
        if (showing === "evo" && alternate.style_data?.evo_art_url) {
          img.src = alternate.style_data.evo_art_url;
        } else if (alternate.style_data?.base_art_url) {
          img.src = alternate.style_data.base_art_url;
        }
        alternateToggle.textContent = "Show: Normal";
        showingAlternate = true;
        const alternateTitleName = alternate.style_data?.name && alternate.style_data.name.trim()
          ? alternate.style_data.name
          : (isEnglishUI ? name : (meta.jpName || name));
        title.textContent = alternateTitleName;
        updateLightboxMetadata(
          meta,
          metaEvo,
          true,
          alternate.style_data,
          showing
        );
      }

      updateLightboxVoices();
    };
  } else if (alternateToggle) {
    alternateToggle.style.display = "none";
  }

  openBtn.onclick = () => {
    window.open(img.src, "_blank");
  };

  downloadImgBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = img.src;
    link.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}_${showing === "evo" ? "evolved" : "base"
      }.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentCardIndex > 0) {
        const prevCardData = filteredCards[currentCardIndex - 1];
        const prevCardObj = allCards[prevCardData.id];
        if (prevCardObj) {
          const prevMeta = prevCardObj.metadata?.common || {};
          const prevMetaEvo = prevCardObj.metadata?.evo || {};
          const prevLines = prevCardObj.voices || [];
          const prevAlternate = prevCardObj.metadata?.alternate || null;

          const prevDisplayName = isEnglishUI ? prevCardData.name : (prevMeta.jpName || prevCardData.name);
          openLightbox({
            name: prevDisplayName,
            meta: prevMeta,
            metaEvo: prevMetaEvo,
            voices: prevLines,
            alternate: prevAlternate,
            cardIndex: currentCardIndex - 1,
            cardData: prevCardData
          });
        }
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentCardIndex < filteredCards.length - 1) {
        const nextCardData = filteredCards[currentCardIndex + 1];
        const nextCardObj = allCards[nextCardData.id];
        if (nextCardObj) {
          const nextMeta = nextCardObj.metadata?.common || {};
          const nextMetaEvo = nextCardObj.metadata?.evo || {};
          const nextLines = nextCardObj.voices || [];
          const nextAlternate = nextCardObj.metadata?.alternate || null;

          const nextDisplayName = isEnglishUI ? nextCardData.name : (nextMeta.jpName || nextCardData.name);
          openLightbox({
            name: nextDisplayName,
            meta: nextMeta,
            metaEvo: nextMetaEvo,
            voices: nextLines,
            alternate: nextAlternate,
            cardIndex: currentCardIndex + 1,
            cardData: nextCardData
          });
        }
      }
    };
  }

  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
}

initializeLanguageFromUrl();

fetch("cards.json")
  .then((res) => res.json())
  .then((cards) => {
    allCards = cards;
    fetch("cv_data.json")
      .then(r => r.ok ? r.json() : null)
      .then((cv) => {
        if (cv) {
          const list = Array.isArray(cv) ? cv : [cv];
          cvDetailsIndex = new Map();
          cvDetailsByKey = {};
          list.forEach((entry) => {
            const key = entry?.source?.jpCV || entry?.source?.name || entry?.jikan?.name || "";
            if (!key) return;
            cvDetailsByKey[key] = entry;
            cvDetailsIndex.set(key, key);
            const en = entry?.jikan?.name;
            if (en) cvDetailsIndex.set(en, key);
          });
          requestAnimationFrame(() => {
            populateCVOptions();
            const q = document.getElementById("search")?.value || "";
            renderCards(allCards, q);
          });
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!document.getElementById("cards")?.children?.length) {
          const q = document.getElementById("search")?.value || "";
          renderCards(allCards, q);
        }
      });

    const uiLangSelect = document.getElementById("ui-lang-select");
    if (uiLangSelect) {
      uiLangSelect.value = isEnglishUI ? "en" : "jp";
    }

    const langText = document.querySelector(".lang-text");
    if (langText) {
      langText.textContent = isEnglishUI
        ? (isEnglishVoice ? "EN" : "JP")
        : (isEnglishVoice ? "英語" : "日本");
    }

    updateLocalization();

    // Restore saved filter values to UI elements
    document.getElementById("filter-rarity").value = activeFilters.rarity;
    document.getElementById("filter-cost-min").value = activeFilters.costMin;
    document.getElementById("filter-cost-max").value = activeFilters.costMax;
    document.getElementById("filter-atk-min").value = activeFilters.atkMin;
    document.getElementById("filter-atk-max").value = activeFilters.atkMax;
    document.getElementById("filter-life-min").value = activeFilters.lifeMin;
    document.getElementById("filter-life-max").value = activeFilters.lifeMax;
    document.getElementById("filter-cv").value = activeFilters.cv;
    document.getElementById("filter-illustrator").value = activeFilters.illustrator;
    document.getElementById("filter-type").value = activeFilters.type;
    document.getElementById("filter-set").value = activeFilters.set;
    document.getElementById("filter-token").value = activeFilters.tokenMode;
    document.getElementById("filter-voices").value = activeFilters.voices;
    document.getElementById("filter-alternate").value = activeFilters.alternate;
    document.getElementById("sort-by").value = activeFilters.sortBy;
    document.getElementById("sort-order").value = activeFilters.sortOrder;
    document.getElementById("view-mode").value = activeFilters.viewMode;
    document.getElementById("group-by").value = activeFilters.groupBy;

    // Apply saved view mode class
    const container = document.querySelector(".container");
    if (activeFilters.viewMode === "waterfall") {
      container.classList.add("waterfall");
    } else if (activeFilters.viewMode === "full") {
      container.classList.add("full");
    }

    renderCards(allCards);

    const debouncedSearchRender = debounce((searchValue) => {
      renderCards(allCards, searchValue);
    }, 150);

    document.getElementById("search").addEventListener("input", (e) => {
      debouncedSearchRender(e.target.value);
    });

    const classes = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta =
        (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      if (meta.class !== undefined && meta.class !== null)
        classes.add(Number(meta.class));
    });

    populateCVOptions();
    populateIllustratorOptions();

    createMobileDropdown("filter-cv", "cv-options", "Type or select CV");
    createMobileDropdown("filter-illustrator", "illustrator-options", "Type or select illustrator");

    const classSel = document.getElementById("filter-class");
    // Clear existing options except the first "Any" option
    classSel.innerHTML = '<option value="">Any</option>';
    Array.from(classes)
      .sort((a, b) => a - b)
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = String(v);
        opt.textContent = getLocalizedClassName(v);
        classSel.appendChild(opt);
      });

    const debouncedFilterRender = debounce(() => {
      renderCards(allCards, document.getElementById("search").value);
    }, 50);

    document.getElementById("filter-rarity").addEventListener("change", (e) => {
      activeFilters.rarity = e.target.value;
      saveCurrentFilters();
      debouncedFilterRender();
    });
    document
      .getElementById("filter-cost-min")
      .addEventListener("input", (e) => {
        activeFilters.costMin = e.target.value;
        saveCurrentFilters();
        debouncedFilterRender();
      });
    document
      .getElementById("filter-cost-max")
      .addEventListener("input", (e) => {
        activeFilters.costMax = e.target.value;
        saveCurrentFilters();
        debouncedFilterRender();
      });
    document.getElementById("filter-atk-min").addEventListener("input", (e) => {
      activeFilters.atkMin = e.target.value;
      saveCurrentFilters();
      debouncedFilterRender();
    });
    document.getElementById("filter-atk-max").addEventListener("input", (e) => {
      activeFilters.atkMax = e.target.value;
      saveCurrentFilters();
      debouncedFilterRender();
    });
    document
      .getElementById("filter-life-min")
      .addEventListener("input", (e) => {
        activeFilters.lifeMin = e.target.value;
        saveCurrentFilters();
        debouncedFilterRender();
      });
    document
      .getElementById("filter-life-max")
      .addEventListener("input", (e) => {
        activeFilters.lifeMax = e.target.value;
        saveCurrentFilters();
        debouncedFilterRender();
      });

    document.getElementById("filter-cv").addEventListener("input", (e) => {
      activeFilters.cv = e.target.value;
      saveCurrentFilters();
      debouncedFilterRender();
    });
    document
      .getElementById("filter-illustrator")
      .addEventListener("input", (e) => {
        activeFilters.illustrator = e.target.value;
        saveCurrentFilters();
        debouncedFilterRender();
      });
    document.getElementById("filter-class").addEventListener("change", (e) => {
      activeFilters.class = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-type").addEventListener("change", (e) => {
      activeFilters.type = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-set").addEventListener("change", (e) => {
      activeFilters.set = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-token").addEventListener("change", (e) => {
      activeFilters.tokenMode = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-voices").addEventListener("change", (e) => {
      activeFilters.voices = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("group-by").addEventListener("change", (e) => {
      activeFilters.groupBy = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document
      .getElementById("filter-alternate")
      .addEventListener("change", (e) => {
        activeFilters.alternate = e.target.value;
        saveCurrentFilters();
        renderCards(allCards, document.getElementById("search").value);
      });

    function createDesktopOverlayMenu(inputId, datalistId) {
      const input = document.getElementById(inputId);
      const datalist = document.getElementById(datalistId);
      if (!input || !datalist) return;

      let menu = null;
      let isOpen = false;

      input.setAttribute("autocomplete", "off");

      const originalListId = datalistId;
      function applyListBinding() {
        const isDesktop = !window.matchMedia("(max-width: 767px)").matches;
        if (isDesktop) {
          if (input.hasAttribute("list")) input.removeAttribute("list");
        } else {
          input.setAttribute("list", originalListId);
        }
      }
      applyListBinding();
      window.addEventListener("resize", applyListBinding);

      function buildMenu() {
        if (menu) menu.remove();
        menu = document.createElement("div");
        menu.className = "desktop-overlay-menu";
        menu.style.position = "absolute";
        menu.style.zIndex = "1000";
        menu.style.minWidth = `${input.offsetWidth}px`;
        menu.style.maxHeight = "260px";
        menu.style.overflowY = "auto";
        menu.style.background = "var(--panel, #1e1e1e)";
        menu.style.border = "1px solid var(--border, #444)";
        menu.style.borderRadius = "6px";
        menu.style.boxShadow = "0 6px 24px rgba(0,0,0,0.3)";
        menu.style.padding = "4px 0";

        // Keep open on hover
        menu.addEventListener("mouseenter", () => clearTimeout(hoverTimeout));
        menu.addEventListener("mouseleave", () => {
          hoverTimeout = setTimeout(() => {
            closeMenu();
          }, 300);
        });

        const clearItem = document.createElement("div");
        clearItem.textContent = "Clear";
        clearItem.style.padding = "6px 10px";
        clearItem.style.cursor = "pointer";
        clearItem.style.color = "var(--muted, #aaa)";
        clearItem.addEventListener("click", () => {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          closeMenu();
          input.focus();
        });
        menu.appendChild(clearItem);

        const sep = document.createElement("div");
        sep.style.height = "1px";
        sep.style.background = "var(--border, #444)";
        sep.style.margin = "4px 0";
        menu.appendChild(sep);

        const options = Array.from(datalist.querySelectorAll("option"));
        options.forEach(option => {
          const item = document.createElement("div");
          item.textContent = option.value;
          item.style.padding = "6px 10px";
          item.style.cursor = "pointer";
          item.addEventListener("mouseenter", () => item.style.background = "rgba(255,255,255,0.08)");
          item.addEventListener("mouseleave", () => item.style.background = "transparent");
          item.addEventListener("click", () => {
            input.value = option.value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            closeMenu();
            input.focus();
          });
          menu.appendChild(item);
        });
        document.body.appendChild(menu);
      }

      function positionMenu() {
        const rect = input.getBoundingClientRect();
        menu.style.left = `${Math.round(rect.left + window.scrollX)}px`;
        menu.style.top = `${Math.round(rect.bottom + window.scrollY)}px`;
        menu.style.minWidth = `${rect.width}px`;
      }


      function openMenu() {
        if (isOpen) return;
        buildMenu();
        positionMenu();
        isOpen = true;
        requestAnimationFrame(() => {
          document.addEventListener("click", onDocClick, { capture: true });
          window.addEventListener("resize", closeMenu, { once: true });
          window.addEventListener("scroll", closeMenu, { once: true });
        });
      }

      function closeMenu() {
        if (!isOpen) return;
        isOpen = false;
        if (menu) {
          menu.remove();
          menu = null;
        }
        document.removeEventListener("click", onDocClick, { capture: true });
      }

      function onDocClick(e) {
        if (menu && (e.target === input || menu.contains(e.target))) return;
        closeMenu();
      }

      // Click still toggles for mobile or persistent interaction expectation

      input.addEventListener("click", (e) => {
        const isDesktop = !window.matchMedia("(max-width: 767px)").matches;
        if (!isDesktop) return;
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
      });
    }

    createDesktopOverlayMenu("filter-cv", "cv-options");
    createDesktopOverlayMenu("filter-illustrator", "illustrator-options");

    if (ENABLE_MANY_VOICES_FILTER) {
      const manyVoicesContainer = document.getElementById(
        "filter-many-voices-container"
      );
      const manyVoicesSelect = document.getElementById("filter-many-voices");

      if (manyVoicesContainer && manyVoicesSelect) {
        manyVoicesContainer.style.display = "block";
        manyVoicesSelect.addEventListener("change", (e) => {
          activeFilters.manyVoices = e.target.value;
          renderCards(allCards, document.getElementById("search").value);
        });
      }
    }
    document.getElementById("sort-by").addEventListener("change", (e) => {
      activeFilters.sortBy = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });

    document.getElementById("sort-order").addEventListener("change", (e) => {
      activeFilters.sortOrder = e.target.value;
      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("view-mode").addEventListener("change", (e) => {
      const mode = e.target.value;
      activeFilters.viewMode = mode;
      const container = document.querySelector(".container");

      // Remove all view mode classes
      container.classList.remove("waterfall", "full");

      // Add appropriate class
      if (mode === "waterfall") {
        container.classList.add("waterfall");
      } else if (mode === "full") {
        container.classList.add("full");
      }

      saveCurrentFilters();
      renderCards(allCards, document.getElementById("search").value);
    });
    const resetBtn = document.getElementById("filters-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        activeFilters.rarity = "";
        activeFilters.costMin = "";
        activeFilters.costMax = "";
        activeFilters.atkMin = "";
        activeFilters.atkMax = "";
        activeFilters.lifeMin = "";
        activeFilters.lifeMax = "";
        activeFilters.cv = "";
        activeFilters.illustrator = "";
        activeFilters.class = "";
        activeFilters.type = "";
        activeFilters.set = "";
        activeFilters.tokenMode = "all";
        activeFilters.sortBy = "alpha";
        activeFilters.sortOrder = "asc";
        activeFilters.manyVoices = "all";
        activeFilters.alternate = "all";

        document.getElementById("filter-rarity").value = "";
        document.getElementById("filter-cost-min").value = "";
        document.getElementById("filter-cost-max").value = "";
        document.getElementById("filter-atk-min").value = "";
        document.getElementById("filter-atk-max").value = "";
        document.getElementById("filter-life-min").value = "";
        document.getElementById("filter-life-max").value = "";
        document.getElementById("filter-illustrator").value = "";
        document.getElementById("filter-cv").value = "";
        document.getElementById("filter-class").value = "";
        document.getElementById("filter-type").value = "";
        document.getElementById("filter-set").value = "";
        document.getElementById("filter-token").value = "all";
        document.getElementById("sort-by").value = "alpha";
        document.getElementById("sort-order").value = "asc";
        document.getElementById("filter-voices").value = "both";
        document.getElementById("filter-alternate").value = "all";
        document.getElementById("view-mode").value = "list";
        document.getElementById("group-by").value = "none";

        if (ENABLE_MANY_VOICES_FILTER) {
          const manyVoicesSelect =
            document.getElementById("filter-many-voices");
          if (manyVoicesSelect) {
            manyVoicesSelect.value = "all";
          }
        }
        document.querySelector(".container").classList.remove("waterfall");
        document.getElementById("search").value = "";

        renderCards(allCards, document.getElementById("search").value);
      });
    }
  });

const debouncedVoiceLanguageToggle = debounce(() => {
  isEnglishVoice = !isEnglishVoice;

  // Save voice language preference
  Settings.save('voiceLanguage', isEnglishVoice ? 'en' : 'jp');

  const langText = document.querySelector(".lang-text");
  if (langText) {
    langText.textContent = isEnglishUI
      ? (isEnglishVoice ? "EN" : "JP")
      : (isEnglishVoice ? "英語" : "日本");
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    if (currentButton) {
      currentButton.classList.remove("playing");
      toggleIcon(currentButton, false);
      const t = currentButton.querySelector(".time");
      if (t) t.textContent = "0:00";
      currentButton = null;
    }
  }

  requestAnimationFrame(() => {
    populateCVOptions();
  });

  // Instead of full render, update existing cards in place
  requestAnimationFrame(() => {
    updateAllCardsForLanguage();
  });
}, 16);

function handleUILanguageChange() {
  const select = document.getElementById("ui-lang-select");
  if (select) {
    isEnglishUI = select.value === "en";

    // Save UI language preference
    Settings.save('uiLanguage', isEnglishUI ? 'en' : 'jp');

    const url = new URL(window.location);
    if (isEnglishUI) {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.set('lang', 'jp');
    }
    window.history.replaceState({}, '', url);
  }

  requestAnimationFrame(() => {
    updateLocalization();
  });

  const cvInput = document.getElementById("filter-cv");
  if (cvInput) {
    cvInput.value = "";
    activeFilters.cv = "";
  }

  const illustratorInput = document.getElementById("filter-illustrator");
  if (illustratorInput) {
    illustratorInput.value = "";
    activeFilters.illustrator = "";
  }


  requestAnimationFrame(() => {
    populateCVOptions();
    populateIllustratorOptions();
  });

  const classSel = document.getElementById("filter-class");
  if (classSel) {
    classSel.innerHTML = '<option value="">Any</option>';
    const classes = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      if (meta.class !== undefined && meta.class !== null) {
        classes.add(Number(meta.class));
      }
    });

    Array.from(classes)
      .sort((a, b) => a - b)
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = String(v);
        opt.textContent = getLocalizedClassName(v);
        classSel.appendChild(opt);
      });
  }

  // Update mobile dropdown menu items when language changes
  requestAnimationFrame(() => {
    updateMobileDropdownMenu("filter-cv", "cv-options");
    updateMobileDropdownMenu("filter-illustrator", "illustrator-options");
  });

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    if (currentButton) {
      currentButton.classList.remove("playing");
      toggleIcon(currentButton, false);
      const t = currentButton.querySelector(".time");
      if (t) t.textContent = "0:00";
      currentButton = null;
    }
  }

  // Instead of full render, update existing cards in place for UI language too
  requestAnimationFrame(() => {
    updateAllCardsForLanguage();
  });
}

// Lightbox Zoom Logic
function setupLightboxZoom() {
  const img = document.getElementById("lightbox-img");
  const wrapper = document.querySelector(".lightbox-img-wrap");

  if (!img || !wrapper) return;

  let zoomScale = 1;
  let ticking = false;

  let hasInteracted = false;

  window.resetLightboxZoom = () => {
    zoomScale = 1;
    hasInteracted = false;
    img.style.transform = `scale(1)`;
    setTimeout(() => {
      img.style.transformOrigin = "center center";
    }, 100);
  };

  const updateZoom = () => {
    img.style.transform = `scale(${zoomScale})`;
    ticking = false;
  };

  // Zoom Hint Logic
  let hintEl = null;
  const hasSeenZoomTip = Settings.load('hasZoomTip');

  if (!hasSeenZoomTip) {
    hintEl = document.createElement('div');
    hintEl.className = 'zoom-hint';
    hintEl.innerHTML = getLocalizedText('Scroll to zoom') || 'Scroll to zoom';
    document.body.appendChild(hintEl);
  }

  const updateHintPosition = (e) => {
    if (hintEl && hintEl.classList.contains('visible')) {
      hintEl.style.left = `${e.clientX}px`;
      hintEl.style.top = `${e.clientY}px`;
    }
  };

  const hideHint = () => {
    if (hintEl) {
      hintEl.classList.remove('visible');
      // If triggered by wheel, we disable it permanently
    }
  };

  const permanentyHideHint = () => {
    if (hintEl) {
      hintEl.classList.remove('visible');
      setTimeout(() => {
        if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
        hintEl = null;
      }, 300);
      Settings.save('hasZoomTip', true);
    }
  };

  wrapper.addEventListener("mouseenter", () => {
    if (!hasInteracted) {
      hasInteracted = true;
      zoomScale = 2;
      updateZoom();

      // Show hint if applicable
      if (hintEl) {
        hintEl.classList.add('visible');
      }
    } else if (hintEl) {
      // Show hint on re-entry if not yet dismissed
      hintEl.classList.add('visible');
    }
  });

  wrapper.addEventListener("mouseleave", () => {
    // Just hide visually, don't dismiss permanently yet
    hideHint();
  });

  wrapper.addEventListener("wheel", (e) => {
    e.preventDefault();
    hasInteracted = true;

    // Dismiss hint permanently on first scroll
    permanentyHideHint();

    const delta = e.deltaY * -0.002;
    // Smoother scaling
    zoomScale += delta;
    zoomScale = Math.min(Math.max(1, zoomScale), 6);

    if (!ticking) {
      requestAnimationFrame(updateZoom);
      ticking = true;
    }
  }, { passive: false });

  wrapper.addEventListener("mousemove", (e) => {
    // Update hint position
    updateHintPosition(e);

    const wRect = wrapper.getBoundingClientRect();
    // Unscaled dimensions relative to flow
    const imgW = img.offsetWidth;
    const imgH = img.offsetHeight;

    // Calculate Image position within Wrapper (Centered)
    const imgLeft = wRect.left + (wRect.width - imgW) / 2;
    const imgTop = wRect.top + (wRect.height - imgH) / 2;

    // Mouse position relative to Image
    let x = e.clientX - imgLeft;
    let y = e.clientY - imgTop;

    // Clamp to image bounds
    x = Math.max(0, Math.min(x, imgW));
    y = Math.max(0, Math.min(y, imgH));

    const xIdx = (x / imgW) * 100;
    const yIdx = (y / imgH) * 100;

    img.style.transformOrigin = `${xIdx}% ${yIdx}%`;
  });


}

document.addEventListener("DOMContentLoaded", () => {
  setupLightboxZoom();

  const voiceToggle = document.getElementById("voice-lang-toggle");
  const uiSelect = document.getElementById("ui-lang-select");

  if (voiceToggle) {
    voiceToggle.addEventListener("click", debouncedVoiceLanguageToggle);
  }

  if (uiSelect) {
    uiSelect.addEventListener("change", handleUILanguageChange);
  }

  // Sticky search fallback to fixed when crossing top
  const sticky = document.querySelector('.sticky-search-container');
  if (sticky) {
    const spacer = document.createElement('div');
    spacer.style.height = `${sticky.offsetHeight}px`;
    spacer.style.display = 'none';
    sticky.parentNode.insertBefore(spacer, sticky);

    let lastFixed = false;
    // Capture the original top position relative to document
    let originalTop = sticky.getBoundingClientRect().top + window.scrollY;

    const onScroll = () => {
      const threshold = lastFixed ? spacer.getBoundingClientRect().top + window.scrollY : originalTop;
      const shouldFix = window.scrollY >= threshold;
      if (shouldFix !== lastFixed) {
        lastFixed = shouldFix;
        if (shouldFix) {
          spacer.style.display = 'block';
          sticky.classList.add('is-fixed');
        } else {
          spacer.style.display = 'none';
          sticky.classList.remove('is-fixed');
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      spacer.style.height = `${sticky.offsetHeight}px`;
      if (!lastFixed) {
        // Recalculate originalTop only when not fixed to avoid drift
        originalTop = sticky.getBoundingClientRect().top + window.scrollY;
      }
      onScroll();
    });
    onScroll();
  }
});

document.getElementById("back-to-top").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll("section")
      .forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.tab;
    document.getElementById(id)?.classList.add("active");
  });
});

// Custom hover dropdowns for filter selects
(function () {
  function createCustomDropdown(selectElement) {
    if (!selectElement || selectElement.classList.contains('custom-hidden')) return;
    if (selectElement.id === 'ui-lang-select') return; // Skip UI language select

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';

    // Function to update trigger text
    const updateTrigger = () => {
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      trigger.textContent = selectedOption ? selectedOption.textContent : '';
    };

    // Populate dropdown options
    const populateOptions = () => {
      dropdown.innerHTML = '';
      Array.from(selectElement.options).forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
        optionDiv.textContent = option.textContent;
        optionDiv.dataset.value = option.value;
        optionDiv.dataset.index = index;

        if (option.selected) {
          optionDiv.classList.add('selected');
        }

        optionDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          selectElement.selectedIndex = index;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          updateTrigger();
          updateSelectedOption();
          closeDropdown();
        });

        dropdown.appendChild(optionDiv);
      });
    };

    // Update selected option styling
    const updateSelectedOption = () => {
      dropdown.querySelectorAll('.custom-select-option').forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === selectElement.selectedIndex);
      });
    };

    let hoverTimeout;
    let isOpen = false;

    const openDropdown = () => {
      if (isOpen) return;
      clearTimeout(hoverTimeout);
      isOpen = true;
      wrapper.classList.add('open');
      populateOptions(); // Refresh options in case they changed
    };

    const closeDropdown = () => {
      isOpen = false;
      wrapper.classList.remove('open');
    };

    const scheduleClose = () => {
      hoverTimeout = setTimeout(closeDropdown, 200);
    };

    const cancelClose = () => {
      clearTimeout(hoverTimeout);
    };

    // Desktop: hover to open
    wrapper.addEventListener('mouseenter', () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        cancelClose();
        openDropdown();
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        scheduleClose();
      }
    });

    // Click also works
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    // Initialize
    updateTrigger();
    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    // Replace select with custom dropdown
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    selectElement.classList.add('custom-hidden');

    // Listen for programmatic changes to the select
    const observer = new MutationObserver(() => {
      updateTrigger();
      if (isOpen) {
        populateOptions();
      }
    });

    observer.observe(selectElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['selected']
    });

    // Store reference for cleanup
    selectElement._customDropdown = {
      wrapper,
      destroy: () => {
        observer.disconnect();
        wrapper.remove();
        selectElement.classList.remove('custom-hidden');
      }
    };
  }

  function initCustomDropdowns() {
    const isDesktop = !window.matchMedia("(max-width: 767px)").matches;
    if (!isDesktop) return;

    const filterSelects = document.querySelectorAll('.filter select');
    filterSelects.forEach(select => {
      if (select.id !== 'ui-lang-select' && !select.classList.contains('custom-hidden')) {
        createCustomDropdown(select);
      }
    });
  }

  function destroyCustomDropdowns() {
    const filterSelects = document.querySelectorAll('.filter select.custom-hidden');
    filterSelects.forEach(select => {
      if (select._customDropdown) {
        select._customDropdown.destroy();
        delete select._customDropdown;
      }
    });
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomDropdowns);
  } else {
    initCustomDropdowns();
  }

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isDesktop = !window.matchMedia("(max-width: 767px)").matches;
      if (isDesktop) {
        initCustomDropdowns();
      } else {
        destroyCustomDropdowns();
      }
    }, 250);
  });
})();

(function () {
  const toggleBtn = document.getElementById("filters-toggle-btn");
  const filtersSection = document.getElementById("filters");

  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function setVisible(visible) {
    filtersSection.style.display = visible ? "block" : "none";
    if (toggleBtn) {
      toggleBtn.textContent = visible ? getLocalizedText('Hide Filters') : getLocalizedText('Show Filters');
      toggleBtn.setAttribute("aria-expanded", String(visible));
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nowVisible = filtersSection.style.display === "none";
      setVisible(nowVisible);
    });
  }

  setVisible(!isMobile());

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      filtersSection.style.display = "block";
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    } else {
      const expand = toggleBtn
        ? toggleBtn.getAttribute("aria-expanded") === "true"
        : false;
      setVisible(expand);
    }
  });
})();


(function () {
  // CV Details modal close handlers
  const cvModal = document.getElementById('cv-details-modal');
  const cvClose = document.getElementById('cv-details-close');
  cvClose?.addEventListener('click', closeCvDetailsModal);
  cvModal?.addEventListener('click', (e) => { if (e.target === cvModal) closeCvDetailsModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cvModal && cvModal.classList.contains('open')) closeCvDetailsModal(); });
  const lb = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');

  let touchStartHandler = null;
  let touchEndHandler = null;

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');

    if (touchStartHandler && touchEndHandler) {
      lb.removeEventListener('touchstart', touchStartHandler);
      lb.removeEventListener('touchend', touchEndHandler);
      touchStartHandler = null;
      touchEndHandler = null;
    }
  }

  closeBtn?.addEventListener('click', close);
  lb?.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });

  window.cleanupLightboxTouchEvents = () => {
    if (window.currentTouchStartHandler && window.currentTouchMoveHandler && window.currentTouchEndHandler) {
      lb.removeEventListener('touchstart', window.currentTouchStartHandler);
      lb.removeEventListener('touchmove', window.currentTouchMoveHandler);
      lb.removeEventListener('touchend', window.currentTouchEndHandler);
      window.currentTouchStartHandler = null;
      window.currentTouchMoveHandler = null;
      window.currentTouchEndHandler = null;
    }
  };
})();

(function () {
  let isProcessing = false;
  let lastKeyTime = 0;
  const DEBOUNCE_TIME = 100; // ms

  function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  function setLoadingState(shortcutKey, isLoading) {
    const shortcuts = document.querySelectorAll('.keyboard-shortcut');
    shortcuts.forEach(shortcut => {
      if (shortcut.textContent.includes(shortcutKey)) {
        if (isLoading) {
          shortcut.classList.add('processing');
        } else {
          shortcut.classList.remove('processing');
        }
      }
    });
  }



  function debounceExecute(fn, delay = 50, shortcutKey = '') {
    if (isProcessing) return;

    isProcessing = true;
    if (shortcutKey) setLoadingState(shortcutKey, true);

    requestAnimationFrame(() => {
      fn();
      setTimeout(() => {
        isProcessing = false;
        if (shortcutKey) setLoadingState(shortcutKey, false);
      }, delay);
    });
  }

  function focusSearchBar() {
    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function toggleFilters() {
    const toggleBtn = document.getElementById("filters-toggle-btn");
    if (toggleBtn) {
      toggleBtn.click();
    }
  }


  function resetFilters() {
    if (isProcessing) return;

    debounceExecute(() => {
      activeFilters.rarity = "";
      activeFilters.costMin = "";
      activeFilters.costMax = "";
      activeFilters.atkMin = "";
      activeFilters.atkMax = "";
      activeFilters.lifeMin = "";
      activeFilters.lifeMax = "";
      activeFilters.cv = "";
      activeFilters.illustrator = "";
      activeFilters.class = "";
      activeFilters.type = "";
      activeFilters.set = "";
      activeFilters.tokenMode = "all";
      activeFilters.sortBy = "alpha";
      activeFilters.sortOrder = "asc";
      activeFilters.manyVoices = "all";
      activeFilters.alternate = "all";

      const elements = [
        "filter-rarity", "filter-cost-min", "filter-cost-max",
        "filter-atk-min", "filter-atk-max", "filter-life-min",
        "filter-life-max", "filter-illustrator", "filter-cv",
        "filter-class", "filter-type", "filter-set", "filter-token",
        "sort-by", "sort-order", "filter-voices", "filter-alternate",
        "view-mode", "search"
      ];

      elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          if (id === "filter-token" || id === "sort-by" || id === "sort-order" ||
            id === "filter-voices" || id === "filter-alternate" || id === "view-mode") {
            element.value = id === "view-mode" ? "list" : "all";
          } else if (id === "sort-by") {
            element.value = "alpha";
          } else if (id === "sort-order") {
            element.value = "asc";
          } else {
            element.value = "";
          }
        }
      });

      if (ENABLE_MANY_VOICES_FILTER) {
        const manyVoicesSelect = document.getElementById("filter-many-voices");
        if (manyVoicesSelect) {
          manyVoicesSelect.value = "all";
        }
      }

      document.querySelector(".container").classList.remove("waterfall");
      document.getElementById("search").value = "";

      renderCards(allCards, document.getElementById("search").value);
    }, 100, 'Ctrl+R');
  }

  function navigateToPreviousCard() {
    const prevBtn = document.getElementById("lightbox-prev");
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.click();
    }
  }

  function navigateToNextCard() {
    const nextBtn = document.getElementById("lightbox-next");
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (isInputFocused()) {
      return;
    }

    const now = Date.now();
    if (now - lastKeyTime < DEBOUNCE_TIME) {
      return;
    }
    lastKeyTime = now;

    const lightbox = document.getElementById('lightbox');
    const isLightboxOpen = lightbox && lightbox.classList.contains('open');

    if (isLightboxOpen) {
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          navigateToPreviousCard();
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          navigateToNextCard();
          break;
        case 'escape':
          e.preventDefault();
          const closeBtn = document.getElementById('lightbox-close');
          if (closeBtn) closeBtn.click();
          break;
      }
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd) {
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          focusSearchBar();
          break;
        case 'g':
          e.preventDefault();
          toggleFilters();
          break;
        case 'l':
          e.preventDefault();
          debouncedVoiceLanguageToggle();
          break;
        case 'r':
          e.preventDefault();
          resetFilters();
          break;
      }
    }
  });
})();