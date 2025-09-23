let isEnglishVoice = false;
let isEnglishUI = true;
let allCards = {};
let currentAudio = null;
let currentButton = null;
let currentCardIndex = -1;
let filteredCards = [];
let currentCardData = null;

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
    'Marwynn' : 'Marwynn',
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
    'Glade':'Glade',
    'Zirconia':'Zirconia',
    'Edelweiss':'Edelweiss',
    'Liu Feng':'Liu Feng',
    'Mukan':'Mukan',
    'Alouette':'Alouette',
    'Ronavero':'Ronavero',
    'Luminous Knights': 'Luminous Knights',
    'Eyfa':'Eyfa',
    'Zell':'Zell',
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
    'Glade':'バックウッド',
    'Zirconia':'スタチウム',
    'Edelweiss':'エーデルワイス',
    'Liu Feng':'リュウフウ',
    'Mukan':'ムカン',
    'Alouette':'アルエット',
    'Ronavero':'ロナヴェロ',
    'Sylvia': 'シルヴィア',
    'Olivia': 'オリヴィエ',
    'Cerberus': 'ケルベロス',
    'Hnikar & Jafnhar': 'フニカル＆ヤヴンハール',
    'Grimnir': 'グリームニル',
    'Prim': 'プリム',
    'Supreme Silver Dragon':'覇道の銀龍',
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
    'Zwei':'ツヴァイ',
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
    "Open Image":"画像をオープンする",
    "Download Image":"画像をダウンロード",
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
  const langParam = getUrlParameter('lang');
  if (langParam === 'en') {
    isEnglishUI = true;
  } else if (langParam === 'jp') {
    isEnglishUI = false;
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

    // Check if dropdown already exists and remove it
    const existingBtn = input.parentNode.querySelector('.mobile-dropdown-btn');
    const existingMenu = input.parentNode.querySelector('.mobile-dropdown-menu');
    if (existingBtn) existingBtn.remove();
    if (existingMenu) existingMenu.remove();

    // Don't move the input - just add the dropdown button as an overlay
    const dropdownBtn = document.createElement("button");
    dropdownBtn.type = "button";
    dropdownBtn.className = "mobile-dropdown-btn";
    dropdownBtn.style.position = "absolute";
    dropdownBtn.style.right = "8px";
    dropdownBtn.style.top = "50%";
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
      // Clear existing menu items (except the clear item)
      const existingItems = dropdownMenu.querySelectorAll('.mobile-dropdown-item:not(.clear-item)');
      existingItems.forEach(item => item.remove());

      const options = Array.from(datalist.querySelectorAll("option"));
      const inputValue = input.value.toLowerCase();
      
      // Filter options based on input value
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

    // Show dropdown when input is focused and has content
    input.addEventListener("focus", () => {
      if (input.value) {
        updateDropdownOptions();
        dropdownMenu.style.display = "block";
      }
    });

    // Update dropdown when typing - don't interfere with existing event listeners
    input.addEventListener("input", (e) => {
      // Don't prevent default or stop propagation to allow other listeners to work
      if (input.value) {
        updateDropdownOptions();
        dropdownMenu.style.display = "block";
      } else {
        dropdownMenu.style.display = "none";
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target) && !input.contains(e.target)) {
        dropdownMenu.style.display = "none";
      }
    });

    // Add padding to input to make room for dropdown button
    input.style.paddingRight = "40px";
    input.style.position = "relative";
    input.style.zIndex = "1";

    // Add dropdown button and menu to the input's parent
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

    // The updateMobileDropdownMenu function is no longer needed since
    // the new implementation updates options dynamically in updateDropdownOptions
    // which is called whenever the input changes or dropdown is opened
  }

const ENABLE_MANY_VOICES_FILTER = false;

const activeFilters = {
  rarity: "",
  costMin: "",
  costMax: "",
  cv: "",
  illustrator: "",
  atkMin: "",
  atkMax: "",
  lifeMin: "",
  lifeMax: "",
  class: "",
  set: "",
  type: "",
  tokenMode: "all",
  sortBy: "alpha",
  sortOrder: "asc",
  voices: "both",
  viewMode: "list",
  groupBy: "none",
  manyVoices: "all",
  alternate: "all",
};

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

function renderCards(cards, filter = "") {
  const container = document.getElementById("cards");
  
  requestAnimationFrame(() => {
    container.innerHTML = "";
    let entries = Object.entries(cards);
    
    if (filter) {
      const normalizedFilter = filter.toLowerCase();
      entries = entries.filter(([cardName, cardObj]) => {
        const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
        const normalizedCardName = cardName.toLowerCase().replace(/_/g, ' ');
        const jpName = meta.jpName ? meta.jpName.toLowerCase() : '';
        return normalizedCardName.includes(normalizedFilter) || jpName.includes(normalizedFilter);
      });
    }

  entries.sort((a, b) => {
    const [nameA, objA] = a;
    const [nameB, objB] = b;
    const metaA = (objA && objA.metadata && objA.metadata.common) || {};
    const metaB = (objB && objB.metadata && objB.metadata.common) || {};

    let result;
    switch (activeFilters.sortBy) {
      case "cost":
        result =
          (metaA.cost ?? 0) - (metaB.cost ?? 0) || nameA.localeCompare(nameB);
        break;
      case "atk":
        result =
          (metaA.atk ?? 0) - (metaB.atk ?? 0) || nameA.localeCompare(nameB);
        break;
      case "life":
        result =
          (metaA.life ?? 0) - (metaB.life ?? 0) || nameA.localeCompare(nameB);
        break;
      case "class":
        result =
          (metaA.class ?? 0) - (metaB.class ?? 0) || nameA.localeCompare(nameB);
        break;
      case "rarity":
        result =
          (metaA.rarity ?? 0) - (metaB.rarity ?? 0) ||
          nameA.localeCompare(nameB);
        break;
      case "alpha":
      default:
        result = nameA.localeCompare(nameB);
        break;
    }

    return activeFilters.sortOrder === "desc" ? -result : result;
  });
    
    // Grouping support
    const groupBy = activeFilters.groupBy;
    let grouped = null;
    if (groupBy !== "none") {
      grouped = new Map();
      entries.forEach(([cardName, cardObj]) => {
        const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
        const key = groupBy === 'illustrator'
          ? (isEnglishUI ? (meta.illustrator || '') : (meta.jpIllustrator || meta.illustrator || ''))
          : (isEnglishVoice ? (meta.cv || '') : (meta.jpCV || ''));
        const groupKey = key && key.trim() ? key.trim() : (groupBy === 'illustrator' ? getLocalizedText('Illustrator') : getLocalizedText('CV'));
        if (!grouped.has(groupKey)) grouped.set(groupKey, []);
        grouped.get(groupKey).push([cardName, cardObj]);
      });
      // Sort groups alphabetically by key
      grouped = new Map(Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])));
    }

    // Store filtered cards for navigation
    filteredCards = [];
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    const renderCardEntry = ([cardName, cardObj], index) => {
      const lines =
        cardObj && Array.isArray(cardObj.voices) ? cardObj.voices : [];
      
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const metaEvo = (cardObj && cardObj.metadata && cardObj.metadata.evo) || {};
      if (!passesFilters(lines, meta, cardObj)) return;
    
      // Add to filtered cards for navigation
      // Use Japanese name if available and language is set to Japanese
      const cardDisplayName = isEnglishUI ? formatName(cardName) : (meta.jpName || formatName(cardName));
      filteredCards.push({
        id: cardName,
        name: cardDisplayName,
        meta,
        metaEvo,
        lines,
        alternate: cardObj.metadata?.alternate
      });

      const cardDiv = document.createElement("div");
      cardDiv.className = "card";

      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";

      const title = document.createElement("h2");
      title.textContent = cardDisplayName;
      cardHeader.appendChild(title);

      if (meta.class !== undefined) {
        const classIcon = document.createElement("div");
        classIcon.className = "card-class-icon";
        classIcon.innerHTML = `<img src="Icons/class_${getClassIconName(
          meta.class
        )}.svg" alt="${getLocalizedClassName(meta.class)}" title="${
          getLocalizedClassName(meta.class)
        }">`;
        cardHeader.appendChild(classIcon);
      }

      cardDiv.appendChild(cardHeader);

      let img = null;

      if (meta.card_image_hash || meta.jpCard_image_hash) {
        const langSeg = isEnglishUI ? 'eng' : 'jpn';
        const jpBaseHash = meta.jpCard_image_hash;
        const baseHash = isEnglishUI ? meta.card_image_hash : (jpBaseHash || meta.card_image_hash);
        const { commonUrl } = buildCardImageUrls(
          baseHash,
          null,
          langSeg
        );
        const jpEvoHash = metaEvo.jpCard_image_hash;
        const evoHash = isEnglishUI ? metaEvo.card_image_hash : (jpEvoHash || metaEvo.card_image_hash);
        const evoUrl = evoHash
          ? `https://shadowverse-wb.com/uploads/card_image/${langSeg}/card/${evoHash}.png`
          : commonUrl;
        const canToggleEvo = Number(meta.type) === 1 && !!evoHash;
      const imgWrap = document.createElement("div");
      imgWrap.className = "card-image";

      img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `${title.textContent} image`;
      img.src = commonUrl;
      img.dataset.variant = "common";
      img.dataset.artType = "normal";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        const cardIndex = filteredCards.findIndex(card => card.id === cardName);
        // Use Japanese name if available and language is set to Japanese
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

      if (cardObj.metadata?.alternate?.style_data) {
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
          const alternateData = cardObj.metadata?.alternate?.style_data;

          if (isAlternate) {
            img.src = commonUrl;
            img.dataset.artType = "normal";
            alternateToggle.classList.remove("active");

            updateCardMetadata(cardDiv, meta, false);
          } else {
            if (alternateData?.hash) {
              const alternateUrl = `https://shadowverse-wb.com/uploads/card_image/eng/card/${alternateData.hash}.png`;
              img.src = alternateUrl;
              img.dataset.artType = "alternate";
              alternateToggle.classList.add("active");

              updateCardMetadata(cardDiv, meta, true, alternateData);
            }
          }

          updateVoiceButtons();
        });

        imgWrap.appendChild(alternateToggle);
      }

      if (meta.skill_text) {
        const tooltip = document.createElement("div");
        tooltip.className = "card-tooltip";
        const skillText = isEnglishUI ? meta.skill_text : (meta.jpSkill_Text || meta.skill_text);
        tooltip.innerHTML = skillText;
        tooltip.style.display = "none";
        imgWrap.appendChild(tooltip);

        const isMobile = window.matchMedia("(max-width: 767px)").matches;

        if (!isMobile) {
          img.addEventListener("mouseenter", () => {
            tooltip.style.display = "block";
          });

          img.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });

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
        }

        const skillBtn = document.createElement("button");
        skillBtn.className = "card-skill-btn";
        skillBtn.setAttribute("aria-label", "Show card skills");
        skillBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 2L17.5 2L20 4.5L20 6L17.5 8.5L17.5 20L6.5 20L6.5 8.5L4 6L4 4.5L6.5 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 10L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 14L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

        let isTooltipVisible = false;

        skillBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (isTooltipVisible) {
            tooltip.style.display = "none";
            isTooltipVisible = false;
          } else {
            tooltip.style.display = "block";
            isTooltipVisible = true;
            
            const rect = img.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            let left = Math.max(10, Math.min(viewportWidth - tooltipRect.width - 10, rect.left + (rect.width - tooltipRect.width) / 2));
            let top = Math.max(10, rect.top - tooltipRect.height - 10);
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
          }
        });

        document.addEventListener("click", (e) => {
          if (isTooltipVisible && !imgWrap.contains(e.target) && !skillBtn.contains(e.target)) {
            tooltip.style.display = "none";
            isTooltipVisible = false;
          }
        });

        imgWrap.appendChild(skillBtn);
      }

      if (activeFilters.viewMode === "list") {
        const imgContent = document.createElement("div");
        imgContent.className = "card-image-content";

        const leftMetadata = document.createElement("div");
        leftMetadata.className = "card-metadata";

        const rightMetadata = document.createElement("div");
        rightMetadata.className = "card-metadata";

        const cvValue = isEnglishVoice ? meta.cv || "" : meta.jpCV || "";
        if (cvValue) {
          const cvItem = document.createElement("div");
          cvItem.className = "card-metadata-item";
          cvItem.innerHTML = `
            <div class="card-metadata-label">${getLocalizedText('CV')}</div>
            <div class="card-metadata-value">${cvValue}</div>
          `;
          leftMetadata.appendChild(cvItem);
        }

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
        imgContent.appendChild(img);
        imgContent.appendChild(rightMetadata);
        imgWrap.appendChild(imgContent);
      } else {
        imgWrap.appendChild(img);
      }

      const toggleContainer = document.createElement("div");
      toggleContainer.className = "img-toggle-container";

      if (canToggleEvo) {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "img-toggle";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("aria-pressed", "false");
        toggleBtn.innerHTML = `
         <span>${getLocalizedText('Show: Evo')}</span>
        `;
        toggleBtn.addEventListener("click", () => {
          const isAlternate = img.dataset.artType === "alternate";
          const alternateData = cardObj.metadata?.alternate?.style_data;

          if (img.dataset.variant === "common") {
            if (isAlternate && alternateData?.evo_hash) {
              const altBase = `https://shadowverse-wb.com/uploads/card_image/${langSeg}/card/`;
              img.src = `${altBase}${isEnglishUI ? alternateData.evo_hash : (alternateData.evo_hash || '')}.png`;
            } else {
              img.src = evoUrl;
            }
            img.dataset.variant = "evo";
            toggleBtn.setAttribute("aria-pressed", "true");
            toggleBtn.innerHTML = `
              <span>Show: Base</span>
            `;
          } else {
            if (isAlternate && alternateData?.hash) {
              const altBase = `https://shadowverse-wb.com/uploads/card_image/${langSeg}/card/`;
              img.src = `${altBase}${isEnglishUI ? alternateData.hash : (alternateData.hash || '')}.png`;
            } else {
              img.src = commonUrl;
            }
            img.dataset.variant = "common";
            toggleBtn.setAttribute("aria-pressed", "false");
            toggleBtn.innerHTML = `
              <span>${getLocalizedText('Show: Evo')}</span>
            `;
          }

          updateVoiceButtons();
        });
        toggleContainer.appendChild(toggleBtn);
      }

      imgWrap.appendChild(toggleContainer);
      cardDiv.appendChild(imgWrap);
    }

    const voiceButtonsContainer = document.createElement("div");
    voiceButtonsContainer.className = "voice-buttons-container";

    const updateVoiceButtons = () => {
      voiceButtonsContainer.innerHTML = "";
      const isAlternate = img && img.dataset.artType === "alternate";
      const voicesToUse =
        isAlternate && cardObj.metadata?.alternate?.voices
          ? cardObj.metadata.alternate.voices
          : lines;

      if (Array.isArray(voicesToUse) && voicesToUse.length > 0) {
        const row = document.createElement("div");
        row.className = "btn-row";
        voicesToUse.forEach((line) => {
          const btn = createAudioButton(line);
          row.appendChild(btn);
        });
        voiceButtonsContainer.appendChild(row);
      } else {
        const row = document.createElement("div");
        row.className = "btn-row";
        const placeholder = document.createElement("div");
        placeholder.className = "audio-btn audio-unavailable";
        placeholder.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/></svg>
          <span>${getLocalizedText('Not available')}</span>
        `;
        row.appendChild(placeholder);
        voiceButtonsContainer.appendChild(row);
      }
    };

      updateVoiceButtons();
      cardDiv.appendChild(voiceButtonsContainer);

      fragment.appendChild(cardDiv);
    };

    if (grouped) {
      grouped.forEach((list, groupKey) => {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.textContent = groupKey || (groupBy === 'illustrator' ? getLocalizedText('Illustrator') : getLocalizedText('CV'));
        fragment.appendChild(groupHeader);
        list.forEach((entry, idx) => renderCardEntry(entry, idx));
      });
    } else {
      // Process all cards (reverted from batch processing for reliability)
      entries.forEach((entry, index) => renderCardEntry(entry, index));
    }
    
    container.appendChild(fragment);
  });
}

function passesFilters(lines, meta, cardData = null) {
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
    const targetCV = isEnglishVoice ? (meta.cv || "") : (meta.jpCV || "");
    const filterCV = activeFilters.cv.trim();
    if (!targetCV.toLowerCase().includes(filterCV.toLowerCase())) return false;
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

  const cvValue =
    isAlternate && alternateData?.cv
      ? alternateData.cv
      : isEnglishVoice
      ? meta.cv || ""
      : meta.jpCV || "";

  const illustratorValue =
    isAlternate && alternateData?.illustrator
      ? alternateData.illustrator
      : isEnglishUI
      ? meta.illustrator || ""
      : meta.jpIllustrator || meta.illustrator || "";

  if (cvValue) {
    const cvItem = document.createElement("div");
    cvItem.className = "card-metadata-item";
    cvItem.innerHTML = `
      <div class="card-metadata-label">CV</div>
      <div class="card-metadata-value">${cvValue}</div>
    `;
    leftMetadata.appendChild(cvItem);
  }

  if (illustratorValue) {
    const illustratorItem = document.createElement("div");
    illustratorItem.className = "card-metadata-item";
    illustratorItem.innerHTML = `
      <div class="card-metadata-label">Illustrator</div>
      <div class="card-metadata-value">${illustratorValue}</div>
    `;
    rightMetadata.appendChild(illustratorItem);
  }
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
    isAlternate && alternateData?.illustrator
      ? alternateData.illustrator
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

  if (isAlternate && alternateData?.flavour_text) {
    flavor.innerHTML = alternateData.flavour_text;
  } else if (
    isAlternate &&
    alternateData?.evo_flavour_text &&
    showing === "evo"
  ) {
    flavor.innerHTML = alternateData.evo_flavour_text;
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
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const metaBox = document.getElementById("lightbox-meta");
  const flavor = document.getElementById("lightbox-flavor");
  const voicesContainer = document.getElementById("lightbox-voices-list");
  const toggle = document.getElementById("lightbox-toggle");
  const openBtn = document.getElementById("lightbox-download");
  const downloadImgBtn = document.getElementById("lightbox-download-img");
  if (openBtn) openBtn.textContent = getLocalizedText('Open Image');
  if (downloadImgBtn) downloadImgBtn.textContent = getLocalizedText('Download Image');
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  const lightboxContent = document.querySelector('.lightbox-content');
  if (lightboxContent) {
    lightboxContent.classList.remove('swipe-left', 'swipe-right');
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
  if (toggle) {
    toggle.textContent = getLocalizedText('Show: Evo');
    toggle.style.display = "none";
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

  const canToggleEvo = Number(meta.type) === 1 && !!metaEvo?.evo_art_url;

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

  const lightboxControls = document.querySelector(".lightbox-controls");

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

        updateLightboxMetadata(meta, metaEvo, false, null, showing);
      } else {
        if (showing === "evo" && alternate.style_data?.evo_art_url) {
          img.src = alternate.style_data.evo_art_url;
        } else if (alternate.style_data?.base_art_url) {
          img.src = alternate.style_data.base_art_url;
        }
        alternateToggle.textContent = "Show: Normal";
        showingAlternate = true;

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
    link.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}_${
      showing === "evo" ? "evolved" : "base"
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
      debouncedFilterRender();
    });
    document
      .getElementById("filter-cost-min")
      .addEventListener("input", (e) => {
        activeFilters.costMin = e.target.value;
        debouncedFilterRender();
      });
    document
      .getElementById("filter-cost-max")
      .addEventListener("input", (e) => {
        activeFilters.costMax = e.target.value;
        debouncedFilterRender();
      });
    document.getElementById("filter-atk-min").addEventListener("input", (e) => {
      activeFilters.atkMin = e.target.value;
      debouncedFilterRender();
    });
    document.getElementById("filter-atk-max").addEventListener("input", (e) => {
      activeFilters.atkMax = e.target.value;
      debouncedFilterRender();
    });
    document
      .getElementById("filter-life-min")
      .addEventListener("input", (e) => {
        activeFilters.lifeMin = e.target.value;
        debouncedFilterRender();
      });
    document
      .getElementById("filter-life-max")
      .addEventListener("input", (e) => {
        activeFilters.lifeMax = e.target.value;
        debouncedFilterRender();
      });
    
    document.getElementById("filter-cv").addEventListener("input", (e) => {
      activeFilters.cv = e.target.value;
      debouncedFilterRender();
    });
    document
      .getElementById("filter-illustrator")
      .addEventListener("input", (e) => {
        activeFilters.illustrator = e.target.value;
        debouncedFilterRender();
      });
    document.getElementById("filter-class").addEventListener("change", (e) => {
      activeFilters.class = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-type").addEventListener("change", (e) => {
      activeFilters.type = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-set").addEventListener("change", (e) => {
      activeFilters.set = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-token").addEventListener("change", (e) => {
      activeFilters.tokenMode = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-voices").addEventListener("change", (e) => {
      activeFilters.voices = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("group-by").addEventListener("change", (e) => {
      activeFilters.groupBy = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document
      .getElementById("filter-alternate")
      .addEventListener("change", (e) => {
        activeFilters.alternate = e.target.value;
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
      renderCards(allCards, document.getElementById("search").value);
    });

    document.getElementById("sort-order").addEventListener("change", (e) => {
      activeFilters.sortOrder = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("view-mode").addEventListener("change", (e) => {
      const mode = e.target.value;
      activeFilters.viewMode = mode;
      const container = document.querySelector(".container");
      if (mode === "waterfall") {
        container.classList.add("waterfall");
      } else {
        container.classList.remove("waterfall");
      }
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

  const searchEl = document.getElementById("search");
  const q = searchEl ? searchEl.value : "";
  requestAnimationFrame(() => {
    renderCards(allCards, q);
  });
}, 16);

function handleUILanguageChange() {
  const select = document.getElementById("ui-lang-select");
  if (select) {
    isEnglishUI = select.value === "en";
    
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

  const searchEl2 = document.getElementById("search");
  const q2 = searchEl2 ? searchEl2.value : "";
  requestAnimationFrame(() => {
    renderCards(allCards, q2);
  });
}

document.addEventListener("DOMContentLoaded", () => {
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


(function(){
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

(function() {
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

  function hideQnATab(){
    if (!isEnglishUI){
      qnaTab = document.querySelector('[data-tab = "qna"]')
      qnaTab.style.display = 'none';
    }
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

      const container = document.querySelector(".container");
      if (container) {
        container.classList.remove("waterfall");
      }

      setTimeout(() => {
        renderCards(allCards, "");
      }, 10);
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

  document.addEventListener('keydown', function(e) {
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
      switch(e.key.toLowerCase()) {
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
      switch(e.key.toLowerCase()) {
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


