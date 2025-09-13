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
  tokenMode: "all",
  sortBy: "alpha",
  sortOrder: "asc",
  voices: "both",
  viewMode: "list",
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

function formatName(name) {
  return name.replace(/_/g, " ");
}

function createAudioButton(line) {
  const container = document.createElement("div");
  container.className = "audio-button-container";

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

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "audio-download-btn";
  downloadBtn.setAttribute("type", "button");
  downloadBtn.setAttribute("aria-label", "Download audio");
  downloadBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  button.addEventListener("click", () => {
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
      if (isEnglish == true) {
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
      });
      currentAudio.addEventListener("loadedmetadata", updateTime);
      currentAudio.addEventListener("timeupdate", updateTime);
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

  downloadBtn.addEventListener("click", () => {
    const audioUrl = isEnglish ? line.en_url : line.url;
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

function renderCards(cards, filter = "") {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  let entries = Object.entries(cards);

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

  entries.forEach(([cardName, cardObj]) => {
    const lines =
      cardObj && Array.isArray(cardObj.voices) ? cardObj.voices : [];
    if (!cardName.toLowerCase().includes(filter.toLowerCase())) return;

    const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
    const metaEvo = (cardObj && cardObj.metadata && cardObj.metadata.evo) || {};
    if (!passesFilters(lines, meta)) return;

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    const title = document.createElement("h2");
    title.textContent = formatName(cardName);
    cardDiv.appendChild(title);

    if (meta.card_image_hash) {
      const { commonUrl, evoUrl } = buildCardImageUrls(
        meta.card_image_hash,
        metaEvo.card_image_hash
      );
      const canToggleEvo = Number(meta.type) === 1 && !!metaEvo.card_image_hash;
      const imgWrap = document.createElement("div");
      imgWrap.className = "card-image";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `${title.textContent} image`;
      img.src = commonUrl;
      img.dataset.variant = "common";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () =>
        openLightbox({
          name: title.textContent,
          meta,
          metaEvo,
          voices: lines,
        })
      );

      // Add tooltip for skill text
      if (meta.skill_text) {
        const tooltip = document.createElement("div");
        tooltip.className = "card-tooltip";
        tooltip.innerHTML = meta.skill_text;
        tooltip.style.display = "none";
        imgWrap.appendChild(tooltip);

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
          
          // Adjust if tooltip would go off screen
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

      if (activeFilters.viewMode === "list") {
        const imgContent = document.createElement("div");
        imgContent.className = "card-image-content";

        const leftMetadata = document.createElement("div");
        leftMetadata.className = "card-metadata";

        const rightMetadata = document.createElement("div");
        rightMetadata.className = "card-metadata";

        const cvValue = isEnglish ? meta.cv || "" : meta.jpCV || "";
        if (cvValue) {
          const cvItem = document.createElement("div");
          cvItem.className = "card-metadata-item";
          cvItem.innerHTML = `
            <div class="card-metadata-label">CV</div>
            <div class="card-metadata-value">${cvValue}</div>
          `;
          leftMetadata.appendChild(cvItem);
        }

        if (meta.illustrator) {
          const illustratorItem = document.createElement("div");
          illustratorItem.className = "card-metadata-item";
          illustratorItem.innerHTML = `
            <div class="card-metadata-label">Illustrator</div>
            <div class="card-metadata-value">${meta.illustrator}</div>
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

      // Always add toggle container for consistent spacing
      const toggleContainer = document.createElement("div");
      toggleContainer.className = "img-toggle-container";
      
      if (canToggleEvo) {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "img-toggle";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("aria-pressed", "false");
        toggleBtn.innerHTML = `
         <span>Show: Evo</span>
        `;
        toggleBtn.addEventListener("click", () => {
          if (img.dataset.variant === "common") {
            img.src = evoUrl;
            img.dataset.variant = "evo";
            toggleBtn.setAttribute("aria-pressed", "true");
            toggleBtn.innerHTML = `
              <span>Show: Base</span>
            `;
          } else {
            img.src = commonUrl;
            img.dataset.variant = "common";
            toggleBtn.setAttribute("aria-pressed", "false");
            toggleBtn.innerHTML = `
              <span>Show: Evo</span>
            `;
          }
        });
        toggleContainer.appendChild(toggleBtn);
      }
      
      imgWrap.appendChild(toggleContainer);
      cardDiv.appendChild(imgWrap);
    }

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

  if (
    activeFilters.costMin !== "" &&
    Number(meta.cost) < Number(activeFilters.costMin)
  )
    return false;
  if (
    activeFilters.costMax !== "" &&
    Number(meta.cost) > Number(activeFilters.costMax)
  )
    return false;

  if (
    activeFilters.atkMin !== "" &&
    Number(meta.atk ?? -Infinity) < Number(activeFilters.atkMin)
  )
    return false;
  if (
    activeFilters.atkMax !== "" &&
    Number(meta.atk ?? Infinity) > Number(activeFilters.atkMax)
  )
    return false;

  if (
    activeFilters.lifeMin !== "" &&
    Number(meta.life ?? -Infinity) < Number(activeFilters.lifeMin)
  )
    return false;
  if (
    activeFilters.lifeMax !== "" &&
    Number(meta.life ?? Infinity) > Number(activeFilters.lifeMax)
  )
    return false;

  if (activeFilters.cv) {
    const targetCV = isEnglish ? meta.cv || "" : meta.jpCV || "";
    if (targetCV !== activeFilters.cv) return false;
  }
  if (activeFilters.illustrator) {
    if ((meta.illustrator || "") !== activeFilters.illustrator) return false;
  }

  if (activeFilters.type) {
    const metaType = Number(meta.type);
    if (activeFilters.type === "amulet") {
      if (!(metaType === 2 || metaType === 3)) return false;
    } else {
      if (metaType !== Number(activeFilters.type)) return false;
    }
  }
  if (activeFilters.class !== "") {
    if (Number(meta.class) !== Number(activeFilters.class)) return false;
  }
  if (activeFilters.set !== "") {
    if (Number(meta.card_set_id) !== Number(activeFilters.set)) return false;
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
  return true;
}

function buildCardImageUrls(cardImageHash, evoCardImageHash) {
  const base = "https://shadowverse-wb.com/uploads/card_image/eng";
  return {
    commonUrl: `${base}/card/${cardImageHash}.png`,
    evoUrl: `${base}/card/${evoCardImageHash}.png`,
  };
}

function openLightbox({ name, meta, metaEvo, voices = [] }) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const metaBox = document.getElementById("lightbox-meta");
  const flavor = document.getElementById("lightbox-flavor");
  const voicesContainer = document.getElementById("lightbox-voices-list");
  const toggle = document.getElementById("lightbox-toggle");
  const openBtn = document.getElementById("lightbox-download");
  const downloadImgBtn = document.getElementById("lightbox-download-img");

  const commonUrl =
    meta?.base_art_url ||
    (meta.card_image_hash
      ? `https://shadowverse-wb.com/uploads/card_image/eng/card/${meta.card_image_hash}.png`
      : "");
  const evoUrl =
    metaEvo?.evo_art_url ||
    (metaEvo?.card_image_hash
      ? `https://shadowverse-wb.com/uploads/card_image/eng/card/${metaEvo.card_image_hash}.png`
      : commonUrl);

  let showing = "common";
  img.src = commonUrl;
  title.textContent = name;
  metaBox.innerHTML = "";

  const addMeta = (label, value) => {
    const l = document.createElement("div");
    l.className = "label";
    l.textContent = label;
    const v = document.createElement("div");
    v.className = "value";
    v.textContent = value;
    metaBox.appendChild(l);
    metaBox.appendChild(v);
  };

  const cvValue = isEnglish ? meta.cv || "" : meta.jpCV || "";
  if (cvValue) addMeta("CV", cvValue);
  if (meta.illustrator) addMeta("Illustrator", meta.illustrator);

  flavor.innerHTML = meta.flavour_text || "";

  voicesContainer.innerHTML = "";
  if (voices && voices.length > 0) {
    voices.forEach((line, index) => {
      const voiceContainer = document.createElement("div");
      voiceContainer.className = "lightbox-voice-container";

      const voiceBtn = document.createElement("button");
      voiceBtn.className = "lightbox-voice-btn";
      voiceBtn.innerHTML = `
        <svg class="voice-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="voice-text">${line.label || line.name || line}</span>
        <span class="voice-duration">--:--</span>
      `;

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "lightbox-download-btn";
      downloadBtn.setAttribute("aria-label", "Download audio");
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
        
        const audioUrl = isEnglish ? line.en_url : line.url;
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
          voiceBtn.querySelector(".voice-duration").textContent = `${current} / ${duration}`;
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
        const audioUrl = isEnglish ? line.en_url : line.url;
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
    voicesContainer.innerHTML = '<div style="color: var(--muted); font-style: italic; text-align: center; padding: 20px;">No voice lines available</div>';
  }

  const canToggleEvo = Number(meta.type) === 1 && !!metaEvo?.evo_art_url;
  if (canToggleEvo) {
    toggle.style.display = "";
    toggle.textContent = "Show: Evo";
    toggle.onclick = () => {
      if (showing === "common") {
        img.src = evoUrl;
        showing = "evo";
        flavor.innerHTML = (metaEvo && metaEvo.flavour_text) || "";
        toggle.textContent = "Show: Base";
      } else {
        img.src = commonUrl;
        showing = "common";
        flavor.innerHTML = (meta && meta.flavour_text) || "";
        toggle.textContent = "Show: Evo";
      }
    };
  } else {
    toggle.style.display = "none";
  }

  openBtn.onclick = () => {
    window.open(img.src, "_blank");
  };

  downloadImgBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = img.src;
    link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${showing === 'evo' ? 'evolved' : 'base'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
}

fetch("cards.json")
  .then((res) => res.json())
  .then((cards) => {
    allCards = cards;
    renderCards(allCards);
    document.getElementById("search").addEventListener("input", (e) => {
      renderCards(allCards, e.target.value);
    });

    const illustrators = new Set();
    let cvs = new Set();
    const classes = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta =
        (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      if (meta.illustrator) illustrators.add(meta.illustrator);

      if (meta.class !== undefined && meta.class !== null)
        classes.add(Number(meta.class));
    });
    const illuSel = document.getElementById("filter-illustrator");
    Array.from(illustrators)
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        illuSel.appendChild(opt);
      });
    const cvSel = document.getElementById("filter-cv");
    function populateCVOptions() {
      cvSel.innerHTML = "";
      const anyOpt = document.createElement("option");
      anyOpt.value = "";
      anyOpt.textContent = "Any";
      cvSel.appendChild(anyOpt);
      cvs = new Set();
      Object.values(allCards).forEach((cardObj) => {
        const meta =
          (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
        const value = isEnglish ? meta.cv || "" : meta.jpCV || "";
        if (value) cvs.add(value);
      });
      Array.from(cvs)
        .sort()
        .forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v;
          cvSel.appendChild(opt);
        });
    }
    populateCVOptions();
    const classSel = document.getElementById("filter-class");
    Array.from(classes)
      .sort((a, b) => a - b)
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = String(v);
        opt.textContent = classLabels[v] ?? String(v);
        classSel.appendChild(opt);
      });

    document.getElementById("filter-rarity").addEventListener("change", (e) => {
      activeFilters.rarity = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document
      .getElementById("filter-cost-min")
      .addEventListener("input", (e) => {
        activeFilters.costMin = e.target.value;
        renderCards(allCards, document.getElementById("search").value);
      });
    document
      .getElementById("filter-cost-max")
      .addEventListener("input", (e) => {
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
    document
      .getElementById("filter-life-min")
      .addEventListener("input", (e) => {
        activeFilters.lifeMin = e.target.value;
        renderCards(allCards, document.getElementById("search").value);
      });
    document
      .getElementById("filter-life-max")
      .addEventListener("input", (e) => {
        activeFilters.lifeMax = e.target.value;
        renderCards(allCards, document.getElementById("search").value);
      });
    document.getElementById("filter-cv").addEventListener("change", (e) => {
      activeFilters.cv = e.target.value;
      renderCards(allCards, document.getElementById("search").value);
    });
    document
      .getElementById("filter-illustrator")
      .addEventListener("change", (e) => {
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
        document.getElementById("view-mode").value = "list";
        document.querySelector(".container").classList.remove("waterfall");
        document.getElementById("search").value = "";

        renderCards(allCards, document.getElementById("search").value);
      });
    }
  });

document.getElementById("lang-toggle").addEventListener("click", () => {
  isEnglish = !isEnglish;
  const btn = document.getElementById("lang-toggle");
  btn.textContent = isEnglish ? "EN" : "JP";

  const prev = activeFilters.cv;
  const cvSel = document.getElementById("filter-cv");
  cvSel.value = "";
  activeFilters.cv = "";

  (function () {
    const anyOpt = document.createElement("option");
    cvSel.innerHTML = "";
    anyOpt.value = "";
    anyOpt.textContent = "Any";
    cvSel.appendChild(anyOpt);
    const set = new Set();
    Object.values(allCards).forEach((cardObj) => {
      const meta =
        (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
      const value = isEnglish ? meta.cv || "" : meta.jpCV || "";
      if (value) set.add(value);
    });
    Array.from(set)
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        cvSel.appendChild(opt);
      });
  })();

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

  renderCards(allCards, document.getElementById("search").value);
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
      toggleBtn.textContent = visible ? "Hide Filters" : "Show Filters";
      toggleBtn.setAttribute("aria-expanded", String(visible));
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nowVisible = filtersSection.style.display === "none";
      setVisible(nowVisible);
    });
  }

  setVisible(true);

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
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }
  closeBtn?.addEventListener('click', close);
  lb?.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
})();


