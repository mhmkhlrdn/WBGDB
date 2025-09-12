let isEnglish = false;
let allCards = {};
let currentAudio = null;
let currentButton = null;
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
  tokenMode: 'all',
  sortBy: 'alpha',
  voices: 'both',
};

const classLabels = {
  0: 'Neutral',
  1: 'Forest',
  2: 'Sword',
  3: 'Rune',
  4: 'Dragon',
  5: 'Abyss',
  6: 'Haven',
  7: 'Portal',
};

function formatName(name) {
  return name.replace(/_/g, " ");
}

function createAudioButton(line) {
  const button = document.createElement("button");
  button.className = "audio-btn";
  button.setAttribute("type", "button");
  button.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path class="icon-play" d="M8 5v14l11-7-11-7z"/>
      <g class="icon-pause" style="display:none"><rect x="7" y="5" width="4" height="14" rx="1"></rect><rect x="13" y="5" width="4" height="14" rx="1"></rect></g>
    </svg>
    <span>${line.label || line.name}</span>
    <span class="time" aria-hidden="true">0:00</span>
  `;

  button.addEventListener("click", () => {
    const isSame = currentButton === button;

    if (currentAudio && !isSame) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentButton) {
        currentButton.classList.remove("playing");
        toggleIcon(currentButton, false);
        const t = currentButton.querySelector('.time');
        if (t) t.textContent = '0:00';
      }
    }

    if (!currentAudio || !isSame) {
      if (isEnglish == true){
        currentAudio = new Audio(line.en_url);
      } else {
        currentAudio = new Audio(line.url);
      }
      const timeEl = button.querySelector('.time');
      const updateTime = () => {
        if (!currentAudio || !timeEl) return;
        const cur = formatTime(currentAudio.currentTime);
        const dur = isFinite(currentAudio.duration) ? formatTime(currentAudio.duration) : '…';
        timeEl.textContent = `${cur}/${dur}`;
      };
      currentAudio.addEventListener("ended", () => {
        if (currentButton) {
          currentButton.classList.remove("playing");
          toggleIcon(currentButton, false);
          const t2 = currentButton.querySelector('.time');
          if (t2) t2.textContent = '0:00';
        }
        currentAudio = null;
        currentButton = null;
      });
      currentAudio.addEventListener('loadedmetadata', updateTime);
      currentAudio.addEventListener('timeupdate', updateTime);
      currentAudio.play();
      currentButton = button;
      button.classList.add("playing");
      toggleIcon(button, true);
      updateTime();
    } else {
      if (currentAudio.paused) {
        currentAudio.play();
        button.classList.add("playing");
        toggleIcon(button, true);
      } else {
        currentAudio.pause();
        button.classList.remove("playing");
        toggleIcon(button, false);
      }
    }
  });

  return button;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2,'0')}`;
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

function renderCards(cards, filter = "") {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  let entries = Object.entries(cards);

  // Sorting
  entries.sort((a, b) => {
    const [nameA, objA] = a; const [nameB, objB] = b;
    const metaA = (objA && objA.metadata && objA.metadata.common) || {};
    const metaB = (objB && objB.metadata && objB.metadata.common) || {};
    switch (activeFilters.sortBy) {
      case 'cost': return (metaA.cost ?? 0) - (metaB.cost ?? 0) || nameA.localeCompare(nameB);
      case 'atk': return (metaA.atk ?? 0) - (metaB.atk ?? 0) || nameA.localeCompare(nameB);
      case 'life': return (metaA.life ?? 0) - (metaB.life ?? 0) || nameA.localeCompare(nameB);
      case 'class': return (metaA.class ?? 0) - (metaB.class ?? 0) || nameA.localeCompare(nameB);
      case 'rarity': return (metaA.rarity ?? 0) - (metaB.rarity ?? 0) || nameA.localeCompare(nameB);
      case 'alpha':
      default: return nameA.localeCompare(nameB);
    }
  });

  entries.forEach(([cardName, cardObj]) => {
    const lines = cardObj && Array.isArray(cardObj.voices) ? cardObj.voices : [];
    if (!cardName.toLowerCase().includes(filter.toLowerCase())) return;

    const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
    const metaEvo = (cardObj && cardObj.metadata && cardObj.metadata.evo) || {};
    if (!passesFilters(lines, meta)) return;

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    const title = document.createElement("h2");
    title.textContent = formatName(cardName);
    cardDiv.appendChild(title);

    // Card image block if hash exists
    if (meta.card_image_hash) {
      const { commonUrl, evoUrl } = buildCardImageUrls(meta.card_image_hash, metaEvo.card_image_hash);
      const canToggleEvo = Number(meta.type) === 1 && !!metaEvo.card_image_hash;
      const imgWrap = document.createElement('div');
      imgWrap.className = 'card-image';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = `${title.textContent} image`;
      img.src = commonUrl;
      img.dataset.variant = 'common';
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openLightbox({
        name: title.textContent,
        commonUrl,
        evoUrl,
        meta,
        metaEvo
      }));

      imgWrap.appendChild(img);
      if (canToggleEvo) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'img-toggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.innerHTML = `
         <span>Show: Evo</span>
        `;
        toggleBtn.addEventListener('click', () => {
          if (img.dataset.variant === 'common') {
            img.src = evoUrl;
            img.dataset.variant = 'evo';
            toggleBtn.setAttribute('aria-pressed', 'true');
            toggleBtn.innerHTML = `
              <span>Show: Base</span>
            `;
          } else {
            img.src = commonUrl;
            img.dataset.variant = 'common';
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5l4 4h-3v6h-2V9H8l4-4z"/></svg>
              <span>Show: Evo</span>
            `;
          }
        });
        imgWrap.appendChild(toggleBtn);
      }
      cardDiv.appendChild(imgWrap);
    }

    // Only render voice buttons when there are lines
    if (Array.isArray(lines) && lines.length > 0) {
      const row = document.createElement("div");
      row.className = "btn-row";
      lines.forEach((line) => {
        const btn = createAudioButton(line);
        row.appendChild(btn);
      });
      cardDiv.appendChild(row);
    }

    container.appendChild(cardDiv);
  });
}

function passesFilters(lines, meta) {
  
  if (activeFilters.rarity) {
    if (Number(meta.rarity) !== Number(activeFilters.rarity)) return false;
  }

  if (activeFilters.costMin !== "" && Number(meta.cost) < Number(activeFilters.costMin)) return false;
  if (activeFilters.costMax !== "" && Number(meta.cost) > Number(activeFilters.costMax)) return false;

  if (activeFilters.atkMin !== "" && Number(meta.atk ?? -Infinity) < Number(activeFilters.atkMin)) return false;
  if (activeFilters.atkMax !== "" && Number(meta.atk ?? Infinity) > Number(activeFilters.atkMax)) return false;

  if (activeFilters.lifeMin !== "" && Number(meta.life ?? -Infinity) < Number(activeFilters.lifeMin)) return false;
  if (activeFilters.lifeMax !== "" && Number(meta.life ?? Infinity) > Number(activeFilters.lifeMax)) return false;

  if (activeFilters.cv) {
    const targetCV = isEnglish ? (meta.cv || "") : (meta.jpCV || "");
    if (targetCV !== activeFilters.cv) return false;
  }
  if (activeFilters.illustrator) {
    if ((meta.illustrator || "") !== activeFilters.illustrator) return false;
  }
  if (activeFilters.class !== "") {
    if (Number(meta.class) !== Number(activeFilters.class)) return false;
  }
  if (activeFilters.type !== "") {
    if (Number(meta.type) !== Number(activeFilters.type)) return false;
  }
  if (activeFilters.set !== "") {
    if (Number(meta.card_set_id) !== Number(activeFilters.set)) return false;
  }
  if (activeFilters.tokenMode === 'exclude') {
    if (meta.is_token) return false;
  } else if (activeFilters.tokenMode === 'only') {
    if (!meta.is_token) return false;
  }
  // Voices presence filter
  if (activeFilters.voices === 'with') {
    if (!Array.isArray(lines) || lines.length === 0) return false;
  } else if (activeFilters.voices === 'without') {
    if (Array.isArray(lines) && lines.length > 0) return false;
  }
  return true;
}

function buildCardImageUrls(cardImageHash, evoCardImageHash) {
  const base = 'https://shadowverse-wb.com/uploads/card_image/eng';
  return {
    commonUrl: `${base}/card/${cardImageHash}.png`,
    evoUrl: `${base}/card/${evoCardImageHash}.png`,
  };
}

function openLightbox({ name, commonUrl, evoUrl, meta, metaEvo }) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const metaBox = document.getElementById('lightbox-meta');
  const flavor = document.getElementById('lightbox-flavor');
  const toggle = document.getElementById('lightbox-toggle');
  const openBtn = document.getElementById('lightbox-download');

  let showing = 'common';
  img.src = commonUrl;
  title.textContent = name;
  metaBox.innerHTML = '';

  const addMeta = (label, value) => {
    const l = document.createElement('div'); l.className = 'label'; l.textContent = label;
    const v = document.createElement('div'); v.className = 'value'; v.textContent = value;
    metaBox.appendChild(l); metaBox.appendChild(v);
  };

  const cvValue = isEnglish ? (meta.cv || '') : (meta.jpCV || '');
  if (cvValue) addMeta('CV', cvValue);
  if (meta.illustrator) addMeta('Illustrator', meta.illustrator);
  // Initialize flavor with common variant
  flavor.innerHTML = meta.flavour_text || '';

  const canToggleEvo = Number(meta.type) === 1 && !!metaEvo?.flavour_text;
  if (canToggleEvo) {
    toggle.style.display = '';
    toggle.textContent = 'Show: Evo';
    toggle.onclick = () => {
      if (showing === 'common') {
        img.src = evoUrl;
        showing = 'evo';
        flavor.innerHTML = (metaEvo && metaEvo.flavour_text) || '';
        toggle.textContent = 'Show: Base';
      } else {
        img.src = commonUrl;
        showing = 'common';
        flavor.innerHTML = (meta && meta.flavour_text) || '';
        toggle.textContent = 'Show: Evo';
      }
    };
  } else {
    toggle.style.display = 'none';
  }

  openBtn.onclick = () => {
    window.open(img.src, '_blank');
  };

  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
}

fetch("cards.json")
  .then((res) => res.json())
  .then((cards) => {
    allCards = cards;
    renderCards(allCards);
    document.getElementById("search").addEventListener("input", (e) => {
      renderCards(allCards, e.target.value);
    });

    // Populate dropdown filters (Illustrator, CV)
    const illustrators = new Set();
    let cvs = new Set();
    const classes = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      if (meta.illustrator) illustrators.add(meta.illustrator);
      // collect classes as numeric ids
      if (meta.class !== undefined && meta.class !== null) classes.add(Number(meta.class));
    });
    const illuSel = document.getElementById('filter-illustrator');
    Array.from(illustrators).sort().forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v; illuSel.appendChild(opt);
    });
    const cvSel = document.getElementById('filter-cv');
    function populateCVOptions() {
      cvSel.innerHTML = '';
      const anyOpt = document.createElement('option');
      anyOpt.value = '';
      anyOpt.textContent = 'Any';
      cvSel.appendChild(anyOpt);
      cvs = new Set();
      Object.values(allCards).forEach((cardObj) => {
        const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
        const value = isEnglish ? (meta.cv || '') : (meta.jpCV || '');
        if (value) cvs.add(value);
      });
      Array.from(cvs).sort().forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v; cvSel.appendChild(opt);
      });
    }
    populateCVOptions();
    const classSel = document.getElementById('filter-class');
    Array.from(classes).sort((a,b)=>a-b).forEach((v) => {
      const opt = document.createElement('option');
      opt.value = String(v);
      opt.textContent = classLabels[v] ?? String(v);
      classSel.appendChild(opt);
    });

    // Filters listeners
    document.getElementById("filter-rarity").addEventListener("change", (e) => {
      activeFilters.rarity = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-cost-min").addEventListener("input", (e) => {
      activeFilters.costMin = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-cost-max").addEventListener("input", (e) => {
      activeFilters.costMax = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-atk-min").addEventListener("input", (e) => {
      activeFilters.atkMin = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-atk-max").addEventListener("input", (e) => {
      activeFilters.atkMax = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-life-min").addEventListener("input", (e) => {
      activeFilters.lifeMin = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-life-max").addEventListener("input", (e) => {
      activeFilters.lifeMax = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-cv").addEventListener("change", (e) => {
      activeFilters.cv = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("filter-illustrator").addEventListener("change", (e) => {
      activeFilters.illustrator = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
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
    document.getElementById("sort-by").addEventListener("change", (e) => {
      activeFilters.sortBy = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document.getElementById("view-mode").addEventListener("change", (e) => {
      const mode = e.target.value;
      const container = document.querySelector('.container');
      if (mode === 'waterfall') {
        container.classList.add('waterfall');
      } else {
        container.classList.remove('waterfall');
      }
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
        activeFilters.tokenMode = 'all';
        activeFilters.sortBy = 'alpha';

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
        document.getElementById("filter-token").value = 'all';
        document.getElementById("sort-by").value = 'alpha';
        document.getElementById("filter-voices").value = 'both';
        document.getElementById("view-mode").value = 'list';
        document.querySelector('.container').classList.remove('waterfall');
        document.getElementById("search").value = '';

        renderCards(allCards, document.getElementById("search").value);
      });
    }
  });

document.getElementById("lang-toggle").addEventListener("click", () => {
  isEnglish = !isEnglish;
  const btn = document.getElementById("lang-toggle");
  btn.textContent = isEnglish ? "EN" : "JP";
  
  // Update title
  const title = document.querySelector('.title h1');
  title.textContent = isEnglish ? "Worlds Beyond • EN Card Voices" : "Worlds Beyond • JP Card Voices";

  // Rebuild CV options to match language
  const prev = activeFilters.cv;
  const cvSel = document.getElementById('filter-cv');
  cvSel.value = '';
  activeFilters.cv = '';
  // repopulate
  (function(){
    const anyOpt = document.createElement('option');
    cvSel.innerHTML = '';
    anyOpt.value = '';
    anyOpt.textContent = 'Any';
    cvSel.appendChild(anyOpt);
    const set = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const value = isEnglish ? (meta.cv || '') : (meta.jpCV || '');
      if (value) set.add(value);
    });
    Array.from(set).sort().forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v; cvSel.appendChild(opt);
    });
  })();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    if (currentButton) {
      currentButton.classList.remove("playing");
      toggleIcon(currentButton, false);
      const t = currentButton.querySelector('.time');
      if (t) t.textContent = '0:00';
      currentButton = null;
    }
  }
});

// Back to top button functionality
document.getElementById("back-to-top").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    document.getElementById(id)?.classList.add('active');
  });
});

// Mobile filters toggle
(function(){
  const toggleBtn = document.getElementById('filters-toggle-btn');
  const primary = document.getElementById('filters');
  const secondary = document.getElementById('filters-secondary');
  function isMobile() { return window.matchMedia('(max-width: 767px)').matches; }
  function setVisible(visible) {
    primary.style.display = visible ? 'flex' : 'none';
    secondary.style.display = visible ? 'flex' : 'none';
    if (toggleBtn) {
      toggleBtn.textContent = visible ? 'Hide Filters' : 'Show Filters';
      toggleBtn.setAttribute('aria-expanded', String(visible));
    }
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const nowVisible = primary.style.display === 'none';
      setVisible(nowVisible);
    });
  }
  // Start visible by default
  setVisible(true);
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      primary.style.display = 'flex';
      secondary.style.display = 'flex';
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      // keep state consistent with button on mobile
      const expand = toggleBtn ? toggleBtn.getAttribute('aria-expanded') === 'true' : false;
      setVisible(expand);
    }
  });
})();

// Lightbox close interactions
(function(){
  const lb = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }
  closeBtn?.addEventListener('click', close);
  lb?.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
})();


