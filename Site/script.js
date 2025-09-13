let isEnglish = false;
let allCards = {};
  let currentAudio = null;
  let currentButton = null;

  // Debounce utility function
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

  // Global function to populate CV options
  function populateCVOptions() {
    const cvDatalist = document.getElementById("cv-options");
    if (!cvDatalist) return;
    
    cvDatalist.innerHTML = "";
    const cvs = new Set();
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
        cvDatalist.appendChild(opt);
      });
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
  const displayText = isMeeting
    ? line.label.substring(7)
    : line.label || line.name;

  const button = document.createElement("button");
  button.className = isMeeting ? "audio-btn meeting-btn" : "audio-btn";
  button.setAttribute("type", "button");
  button.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path class="icon-play" d="M8 5v14l11-7-11-7z"/>
      <g class="icon-pause" style="display:none"><rect x="7" y="5" width="4" height="14" rx="1"></rect><rect x="13" y="5" width="4" height="14" rx="1"></rect></g>
    </svg>
    <span>${displayText}</span>
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
  
  // Early filter by search term to reduce processing
  if (filter) {
    const normalizedFilter = filter.toLowerCase();
    entries = entries.filter(([cardName]) => {
      const normalizedCardName = cardName.toLowerCase().replace(/_/g, ' ');
      return normalizedCardName.includes(normalizedFilter);
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

  // Use document fragment for better performance
  const fragment = document.createDocumentFragment();
  
  entries.forEach(([cardName, cardObj]) => {
    const lines =
      cardObj && Array.isArray(cardObj.voices) ? cardObj.voices : [];
    
    const meta = (cardObj && cardObj.metadata && cardObj.metadata.common) || {};
    const metaEvo = (cardObj && cardObj.metadata && cardObj.metadata.evo) || {};
    if (!passesFilters(lines, meta, cardObj)) return;

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    const title = document.createElement("h2");
    title.textContent = formatName(cardName);
    cardHeader.appendChild(title);

    if (meta.class !== undefined) {
      const classIcon = document.createElement("div");
      classIcon.className = "card-class-icon";
      classIcon.innerHTML = `<img src="Icons/class_${getClassIconName(
        meta.class
      )}.svg" alt="${classLabels[meta.class]}" title="${
        classLabels[meta.class]
      }">`;
      cardHeader.appendChild(classIcon);
    }

    cardDiv.appendChild(cardHeader);

    let img = null;

    if (meta.card_image_hash) {
      const { commonUrl, evoUrl } = buildCardImageUrls(
        meta.card_image_hash,
        metaEvo.card_image_hash
      );
      const canToggleEvo = Number(meta.type) === 1 && !!metaEvo.card_image_hash;
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
        openLightbox({
          name: title.textContent,
          meta,
          metaEvo,
          voices: lines,
          alternate: cardObj.metadata?.alternate,
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
          const isAlternate = img.dataset.artType === "alternate";
          const alternateData = cardObj.metadata?.alternate?.style_data;

          if (img.dataset.variant === "common") {
            if (isAlternate && alternateData?.evo_hash) {
              img.src = `https://shadowverse-wb.com/uploads/card_image/eng/card/${alternateData.evo_hash}.png`;
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
              img.src = `https://shadowverse-wb.com/uploads/card_image/eng/card/${alternateData.hash}.png`;
            } else {
              img.src = commonUrl;
            }
            img.dataset.variant = "common";
            toggleBtn.setAttribute("aria-pressed", "false");
            toggleBtn.innerHTML = `
              <span>Show: Evo</span>
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
      }
    };

    updateVoiceButtons();
    cardDiv.appendChild(voiceButtonsContainer);

    fragment.appendChild(cardDiv);
  });
  
  // Append all cards at once for better performance
  container.appendChild(fragment);
}

function passesFilters(lines, meta, cardData = null) {
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
    const filterCV = activeFilters.cv.trim();
    if (!targetCV.toLowerCase().includes(filterCV.toLowerCase())) return false;
  }
  if (activeFilters.illustrator) {
    const illustrator = meta.illustrator || "";
    const filterIllustrator = activeFilters.illustrator.trim();
    if (!illustrator.toLowerCase().includes(filterIllustrator.toLowerCase())) return false;
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

function buildCardImageUrls(cardImageHash, evoCardImageHash) {
  const base = "https://shadowverse-wb.com/uploads/card_image/eng";
  return {
    commonUrl: `${base}/card/${cardImageHash}.png`,
    evoUrl: `${base}/card/${evoCardImageHash}.png`,
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
      : isEnglish
      ? meta.cv || ""
      : meta.jpCV || "";

  const illustratorValue =
    isAlternate && alternateData?.illustrator
      ? alternateData.illustrator
      : meta.illustrator || "";

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
      : isEnglish
      ? meta.cv || ""
      : meta.jpCV || "";

  const illustratorValue =
    isAlternate && alternateData?.illustrator
      ? alternateData.illustrator
      : meta.illustrator || "";

  if (cvValue) {
    const cvItem = document.createElement("div");
    cvItem.innerHTML = `
      <div class="label">CV</div>
      <div class="value">${cvValue}</div>
    `;
    metaBox.appendChild(cvItem);
  }

  if (illustratorValue) {
    const illustratorItem = document.createElement("div");
    illustratorItem.innerHTML = `
      <div class="label">Illustrator</div>
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
      flavor.innerHTML = metaEvo.flavour_text;
    } else {
      flavor.innerHTML = meta.flavour_text || "";
    }
  }
}

function openLightbox({ name, meta, metaEvo, voices = [], alternate = null }) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const metaBox = document.getElementById("lightbox-meta");
  const flavor = document.getElementById("lightbox-flavor");
  const voicesContainer = document.getElementById("lightbox-voices-list");
  const toggle = document.getElementById("lightbox-toggle");
  const openBtn = document.getElementById("lightbox-download");
  const downloadImgBtn = document.getElementById("lightbox-download-img");

  let alternateToggle = document.getElementById("lightbox-alternate-toggle");
  if (alternateToggle) {
    alternateToggle.textContent = "Show: Alternate";
    alternateToggle.style.display = "none";
  }
  if (toggle) {
    toggle.textContent = "Show: Evo";
    toggle.style.display = "none";
  }

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
        const displayText = isMeeting
          ? line.label.substring(7)
          : line.label || line.name || line;

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
      voicesContainer.innerHTML =
        '<div style="color: var(--muted); font-style: italic; text-align: center; padding: 20px;">No voice lines available</div>';
    }
  };

  updateLightboxVoices();

  const canToggleEvo = Number(meta.type) === 1 && !!metaEvo?.evo_art_url;

  if (canToggleEvo) {
    toggle.style.display = "";
    toggle.textContent = "Show: Evo";
    toggle.onclick = () => {
      if (showing === "common") {
        if (showingAlternate && alternate?.style_data?.evo_art_url) {
          img.src = alternate.style_data.evo_art_url;
        } else {
          img.src = evoUrl;
        }
        showing = "evo";
        toggle.textContent = "Show: Base";

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
        toggle.textContent = "Show: Evo";

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

  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
}

fetch("cards.json")
  .then((res) => res.json())
  .then((cards) => {
    allCards = cards;
    renderCards(allCards);
    
    // Create debounced render function for search
    const debouncedSearchRender = debounce((searchValue) => {
      renderCards(allCards, searchValue);
    }, 150);
    
    document.getElementById("search").addEventListener("input", (e) => {
      debouncedSearchRender(e.target.value);
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
    const illuDatalist = document.getElementById("illustrator-options");
    Array.from(illustrators)
      .sort()
      .forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        illuDatalist.appendChild(opt);
      });
    // Populate CV options using the global function
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
    // Create debounced render function for filters
    const debouncedFilterRender = debounce(() => {
      renderCards(allCards, document.getElementById("search").value);
    }, 100);
    
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
    document
      .getElementById("filter-alternate")
      .addEventListener("change", (e) => {
        activeFilters.alternate = e.target.value;
        renderCards(allCards, document.getElementById("search").value);
      });

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

document.getElementById("lang-toggle").addEventListener("click", () => {
  isEnglish = !isEnglish;
  const langText = document.querySelector(".lang-text");
  langText.textContent = isEnglish ? "EN" : "JP";

  const prev = activeFilters.cv;
  const cvInput = document.getElementById("filter-cv");
  cvInput.value = "";
  activeFilters.cv = "";

  // Repopulate CV options for the new language
  populateCVOptions();
  
  // Re-render cards to apply the language change
  renderCards(allCards, document.getElementById("search").value);

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


