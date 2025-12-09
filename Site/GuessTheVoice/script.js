let allCards = {};
let availableClips = {}; // Map<CardName, Array<VoiceIndex>>
let currentRound = null;
let score = 0;
let isEnglishVoice = false;
let isHardMode = false; 
let currentAudio = null;
let currentVoiceIndex = 0; // Track which voice to play next in Normal mode
let cardSearchList = []; // Array of {key, en, jp, img}
let timerStart = null; // Timestamp when play button was pressed
let guessHistory = []; // Array of {name, time, label, hints} - current session
let sessionHistory = []; // Array of completed sessions {date, score, guesses, mode}
let usedHints = []; // Track which hints have been shown for current round
let hintsUsedCount = 0; // Count of hints used for current round

// DOM Elements
const scoreEl = document.getElementById('score');
const playBtn = document.getElementById('play-btn');
const guessInput = document.getElementById('guess-input');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const messageEl = document.getElementById('message');
const langToggle = document.getElementById('lang-toggle');
const difficultyToggle = document.getElementById('difficulty-toggle');
const container = document.querySelector('.game-container');
const dropdown = document.getElementById('custom-dropdown');
const historyContainer = document.getElementById('history-container');
const historyList = document.getElementById('history-list');
const hintsDisplay = document.getElementById('hints-display');

// Initialize
async function init() {
  try {
    const response = await fetch('../cards.json');
    allCards = await response.json();
    loadSessionHistory(); // Load saved history from localStorage
    resetSession();
    prepareSearchList();
    startRound();
  } catch (error) {
    console.error('Failed to load cards:', error);
    messageEl.textContent = 'Error loading game data.';
    messageEl.className = 'message-wrong';
  }
}

function saveSessionHistoryToStorage() {
  try {
    // Convert dates to ISO strings for storage
    const storageData = sessionHistory.map(session => ({
      date: session.date.toISOString(),
      score: session.score,
      guesses: session.guesses,
      mode: session.mode || 'Hard' // Default to Hard for backward compatibility
    }));
    localStorage.setItem('guessTheVoiceHistory', JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save session history:', error);
  }
}

function loadSessionHistory() {
  try {
    const stored = localStorage.getItem('guessTheVoiceHistory');
    if (stored) {
      const data = JSON.parse(stored);
      // Convert ISO strings back to Date objects
      sessionHistory = data.map(session => ({
        date: new Date(session.date),
        score: session.score,
        guesses: session.guesses,
        mode: session.mode || 'Hard' // Default to Hard for backward compatibility
      }));
      renderSessionHistory();
    }
  } catch (error) {
    console.error('Failed to load session history:', error);
    sessionHistory = [];
  }
}

function resetSession() {
  score = 0;
  updateScore();
  availableClips = {};
  guessHistory = []; // Clear current session history only
  // Don't clear historyList - session history should persist
  
  // Build available clips map
  Object.keys(allCards).forEach(key => {
    const card = allCards[key];
    const voices = card.voices || [];
    if (voices.length > 0) {
      // Store indices of available voices
      availableClips[key] = voices.map((_, index) => index);
    }
  });
}

function prepareSearchList() {
  cardSearchList = [];
  Object.keys(allCards).forEach(key => {
    const card = allCards[key];
    const meta = card.metadata?.common;
    if (!meta) return;
    
    // Determine image URL (use base art)
    // Path in json is like "Art/1000.png", we need "../Art/1000.png"
    const imgUrl = meta.base_art_url ? `../${meta.base_art_url}` : '';
    
    cardSearchList.push({
      key: key,
      en: key.replace(/_/g, ' '),
      jp: meta.jpName || '',
      img: imgUrl
    });
  });
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function startRound() {
  // Clear previous round state
  guessInput.value = '';
  messageEl.textContent = '';
  messageEl.className = '';
  dropdown.classList.remove('active');
  timerStart = null; // Reset timer
  currentVoiceIndex = 0; // Reset voice index for Normal mode
  usedHints = []; // Reset hints
  hintsUsedCount = 0;
  hintsDisplay.innerHTML = ''; // Clear hints display
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  // Check if any clips left
  const cardKeys = Object.keys(availableClips);
  if (cardKeys.length === 0) {
    endGame(true);
    return;
  }
  
  // Pick random card, ensuring it's not the same as last time if possible
  let randomCardKey;
  if (cardKeys.length === 1) {
    randomCardKey = cardKeys[0];
  } else {
    do {
      randomCardKey = getRandomItem(cardKeys);
    } while (currentRound && randomCardKey === currentRound.cardKey);
  }

  const card = allCards[randomCardKey];
  const clipIndices = availableClips[randomCardKey];
  
  if (isHardMode) {
    // Hard mode: Pick one random clip
    const randomClipIndex = getRandomItem(clipIndices);
    
    // Remove this clip from available
    const indexInArray = clipIndices.indexOf(randomClipIndex);
    clipIndices.splice(indexInArray, 1);
    if (clipIndices.length === 0) {
      delete availableClips[randomCardKey];
    }
    
    const voiceObj = card.voices[randomClipIndex];
    
    currentRound = {
      cardKey: randomCardKey,
      cardNameEn: randomCardKey.replace(/_/g, ' '),
      cardNameJp: card.metadata?.common?.jpName,
      voiceObj: voiceObj,
      allVoices: null // Only one voice in hard mode
    };
  } else {
    // Normal mode: Use all clips for this card
    const allVoices = clipIndices.map(idx => card.voices[idx]);
    
    // Remove this card entirely from available
    delete availableClips[randomCardKey];
    
    currentRound = {
      cardKey: randomCardKey,
      cardNameEn: randomCardKey.replace(/_/g, ' '),
      cardNameJp: card.metadata?.common?.jpName,
      voiceObj: allVoices[0], // Use first voice for label display
      allVoices: allVoices // All voices to play
    };
  }
  
  console.log('Round started. Answer:', currentRound.cardNameEn, '/', currentRound.cardNameJp, '| Mode:', isHardMode ? 'Hard' : 'Normal');
}

function playCurrentAudio() {
  if (!currentRound || !currentRound.voiceObj) return;
  
  // Start timer on first play
  if (!timerStart) {
    timerStart = Date.now();
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  
  if (isHardMode || !currentRound.allVoices) {
    // Hard mode: play single voice
    const url = isEnglishVoice ? currentRound.voiceObj.en_url : currentRound.voiceObj.url;
    const fixedUrl = '../' + url;
    
    currentAudio = new Audio(fixedUrl);
    currentAudio.play().catch(e => {
      console.error("Audio play failed", e);
      messageEl.textContent = "Error playing audio. Try toggling language?";
    });
  } else {
    // Normal mode: play one voice at a time, cycling through them
    const voiceObj = currentRound.allVoices[currentVoiceIndex];
    const url = isEnglishVoice ? voiceObj.en_url : voiceObj.url;
    const fixedUrl = '../' + url;
    
    currentAudio = new Audio(fixedUrl);
    currentAudio.play().catch(e => {
      console.error("Audio play failed", e);
      messageEl.textContent = "Error playing audio. Try toggling language?";
    });
    
    // Move to next voice for next play (cycle back to 0 if at end)
    currentVoiceIndex = (currentVoiceIndex + 1) % currentRound.allVoices.length;
  }
}

function checkGuess() {
  if (!currentRound) return;
  
  const userGuess = guessInput.value.trim().toLowerCase();
  if (!userGuess) return;
  
  const correctEn = currentRound.cardNameEn.toLowerCase();
  const correctJp = (currentRound.cardNameJp || '').toLowerCase();
  
  if (userGuess === correctEn || userGuess === correctJp) {
    // Correct
    score++;
    updateScore();
    
    // Calculate time taken
    let timeTaken = 0;
    if (timerStart) {
      timeTaken = Date.now() - timerStart;
    }
    
    // Add to history
    addToHistory(currentRound.cardNameEn, timeTaken, currentRound.voiceObj.label, hintsUsedCount);
    
    messageEl.textContent = 'Correct!';
    messageEl.className = 'message-correct';
    container.classList.add('shake'); // Just for fun feedback
    setTimeout(() => container.classList.remove('shake'), 300);
    
    setTimeout(startRound, 1000);
  } else {
    // Incorrect
    messageEl.textContent = `Game Over! It was: ${currentRound.cardNameEn} / ${currentRound.cardNameJp || ''}`;
    messageEl.className = 'message-wrong';
    
    // Save current session to history if there were any correct guesses
    if (guessHistory.length > 0) {
      saveSessionToHistory(score);
    }
    
    score = 0;
    updateScore();
    
    // Reset session
    setTimeout(() => {
      resetSession();
      startRound();
    }, 3000);
  }
}

function updateScore() {
  scoreEl.textContent = score;
}

function endGame(win) {
  messageEl.textContent = win ? 'You cleared all clips! Amazing!' : 'Game Over';
  guessInput.disabled = true;
  submitBtn.disabled = true;
  playBtn.disabled = true;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}.${Math.floor(milliseconds / 100)}s`;
}

function formatLabel(label) {
  if (!label) return '';
  
  // Handle meeting labels (e.g., "MeetingMaeve" -> "Meeting: Maeve")
  if (label.startsWith('Meeting')) {
    const characterName = label.replace('Meeting', '');
    return `Meeting: ${characterName}`;
  }
  
  // Handle other labels - add space before capital letters
  // e.g., "SuperEvolve" -> "Super Evolve"
  return label.replace(/([A-Z])/g, ' $1').trim();
}

function showHint() {
  if (!currentRound) return;
  
  const meta = allCards[currentRound.cardKey].metadata?.common;
  if (!meta) return;
  
  // Available hint types
  const hintTypes = ['class', 'type', 'set', 'rarity', 'firstLetter'];
  
  // Filter out already used hints
  const availableHints = hintTypes.filter(h => !usedHints.includes(h));
  
  if (availableHints.length === 0) {
    messageEl.textContent = 'No more hints available!';
    messageEl.className = 'message-wrong';
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = '';
    }, 2000);
    return;
  }
  
  // Pick random hint
  const hintType = availableHints[Math.floor(Math.random() * availableHints.length)];
  usedHints.push(hintType);
  hintsUsedCount++;
  
  let hintText = '';
  
  switch(hintType) {
    case 'class':
      // Map class number to name
      const classNames = {
        0: 'Neutral',
        1: 'Forestcraft',
        2: 'Swordcraft',
        3: 'Runecraft',
        4: 'Dragoncraft',
        5: 'Abysscraft',
        6: 'Havencraft',
        7: 'Portalcraft'
      };
      hintText = `Class: ${classNames[meta.class] || 'Unknown'}`;
      break;
    case 'type':
      const typeNames = {
        1: 'Follower',
        2: 'Amulet',
        3: 'Amulet',
        4: 'Spell'
      };
      hintText = `Type: ${typeNames[meta.type] || 'Unknown'}`;
      break;
    case 'set':
      const setNames = {
        10000: 'Basic',
        10001: 'Legends Rise',
        10002: 'Infinity Evolved',
        10003: 'Heirs of the Omen',
        10004: 'Skybound Dragons'
      };
      hintText = `Set: ${setNames[meta.card_set_id] || 'Token'}`;
      break;
    case 'rarity':
      const rarityNames = {
        1: 'Bronze',
        2: 'Silver',
        3: 'Gold',
        4: 'Legendary'
      };
      hintText = `Rarity: ${rarityNames[meta.rarity] || 'Unknown'}`;
      break;
    case 'firstLetter':
      hintText = `First Letter: ${currentRound.cardNameEn.charAt(0)}`;
      break;
  }
  
  // Display hint
  const hintTag = document.createElement('div');
  hintTag.className = 'hint-tag';
  hintTag.textContent = hintText;
  hintsDisplay.appendChild(hintTag);
}

function addToHistory(cardName, time, label, hints) {
  guessHistory.push({ name: cardName, time: time, label: label, hints: hints });
  
  // Show history container
  historyContainer.style.display = 'block';
  
  // Format the label
  const formattedLabel = formatLabel(label);
  
  // Add new item to the list
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <span class="history-item-name">
      ${cardName}
      ${formattedLabel ? `<span class="history-item-divider">•</span><span class="history-item-label">${formattedLabel}</span>` : ''}
      ${hints > 0 ? `<span class="history-item-divider">•</span><span class="history-item-hints">${hints} hint${hints > 1 ? 's' : ''}</span>` : ''}
    </span>
    <span class="history-item-time">${formatTime(time)}</span>
  `;
  historyList.appendChild(item);
}

function saveSessionToHistory(finalScore) {
  const session = {
    date: new Date(),
    score: finalScore,
    guesses: [...guessHistory], // Copy the array
    mode: isHardMode ? 'Hard' : 'Normal'
  };
  
  sessionHistory.push(session);
  saveSessionHistoryToStorage(); // Save to localStorage
  renderSessionHistory();
}

function renderSessionHistory() {
  // Clear current history display
  historyList.innerHTML = '';
  
  if (sessionHistory.length === 0) {
    historyContainer.style.display = 'none';
    return;
  }
  
  historyContainer.style.display = 'block';
  
  // Render each session in reverse order (newest first)
  sessionHistory.slice().reverse().forEach((session, index) => {
    const sessionIndex = sessionHistory.length - 1 - index;
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session-group';
    
    // Format date
    const dateStr = session.date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Session header (clickable)
    const header = document.createElement('div');
    header.className = 'session-header';
    const modeLabel = session.mode || 'Hard';
    header.innerHTML = `
      <span class="session-info">
        <span class="session-date">${dateStr}</span>
        <span class="session-mode">${modeLabel}</span>
        <span class="session-score">Score: ${session.score}</span>
        <span class="session-count">${session.guesses.length} guess${session.guesses.length > 1 ? 'es' : ''}</span>
      </span>
      <svg class="session-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    `;
    
    // Session details (collapsible)
    const details = document.createElement('div');
    details.className = 'session-details';
    details.style.display = 'none';
    
    session.guesses.forEach(guess => {
      const formattedLabel = formatLabel(guess.label);
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <span class="history-item-name">
          ${guess.name}
          ${formattedLabel ? `<span class="history-item-divider">•</span><span class="history-item-label">${formattedLabel}</span>` : ''}
          ${guess.hints > 0 ? `<span class="history-item-divider">•</span><span class="history-item-hints">${guess.hints} hint${guess.hints > 1 ? 's' : ''}</span>` : ''}
        </span>
        <span class="history-item-time">${formatTime(guess.time)}</span>
      `;
      details.appendChild(item);
    });
    
    // Toggle functionality
    header.addEventListener('click', () => {
      const isOpen = details.style.display === 'block';
      details.style.display = isOpen ? 'none' : 'block';
      header.classList.toggle('open', !isOpen);
    });
    
    sessionDiv.appendChild(header);
    sessionDiv.appendChild(details);
    historyList.appendChild(sessionDiv);
  });
}

// Fuzzy Matching Implementation (Levenshtein Distance)
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function handleInput() {
  const val = guessInput.value.trim().toLowerCase();
  if (!val) {
    dropdown.classList.remove('active');
    return;
  }
  
  // Calculate score for each card
  // We'll use a combination of includes check (high priority) and Levenshtein (low priority)
  const results = cardSearchList.map(item => {
    const en = item.en.toLowerCase();
    const jp = item.jp.toLowerCase();
    
    let score = 1000; // Lower is better
    
    // Exact match
    if (en === val || jp === val) score = 0;
    // Starts with
    else if (en.startsWith(val) || jp.startsWith(val)) score = 10;
    // Includes
    else if (en.includes(val) || jp.includes(val)) score = 20;
    // Fuzzy
    else {
      const distEn = levenshtein(val, en);
      const distJp = jp ? levenshtein(val, jp) : 1000;
      score = 50 + Math.min(distEn, distJp);
    }
    
    return { item, score };
  });
  
  // Filter out bad matches (arbitrary threshold) and sort
  // For fuzzy, we only care if it's somewhat close.
  // Let's just take top 5 regardless, but maybe filter really bad ones if input is long?
  // Actually, user asked for "5 most similar result".
  
  results.sort((a, b) => a.score - b.score);
  
  const top5 = results.slice(0, 5);
  
  renderDropdown(top5.map(r => r.item));
}

function renderDropdown(items) {
  dropdown.innerHTML = '';
  if (items.length === 0) {
    dropdown.classList.remove('active');
    return;
  }
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.innerHTML = `
      <img src="${item.img}" class="dropdown-img" loading="lazy" alt="">
      <div class="dropdown-text">
        <span class="dropdown-name-en">${item.en}</span>
        <span class="dropdown-name-jp">${item.jp}</span>
      </div>
    `;
    div.addEventListener('click', () => {
      guessInput.value = item.en;
      dropdown.classList.remove('active');
      checkGuess(); // Optional: auto-submit on click? Or just fill? User said "inputted a key", usually click fills. Let's just fill.
      // Actually, let's just fill and let user click guess or press enter.
      // But wait, if they click, they probably mean that's their guess.
      // Let's focus input back.
      guessInput.focus();
    });
    dropdown.appendChild(div);
  });
  
  dropdown.classList.add('active');
}

// Event Listeners
playBtn.addEventListener('click', playCurrentAudio);

submitBtn.addEventListener('click', checkGuess);

hintBtn.addEventListener('click', showHint);

guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    checkGuess();
    dropdown.classList.remove('active');
  }
});

guessInput.addEventListener('input', handleInput);

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!guessInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

langToggle.addEventListener('click', () => {
  isEnglishVoice = !isEnglishVoice;
  langToggle.textContent = isEnglishVoice ? 'Voice: EN' : 'Voice: JP';
});

difficultyToggle.addEventListener('click', () => {
  // Save current session if there were any correct guesses
  if (guessHistory.length > 0) {
    saveSessionToHistory(score);
  }
  
  // Toggle difficulty mode
  isHardMode = !isHardMode;
  difficultyToggle.textContent = isHardMode ? 'Mode: Hard' : 'Mode: Normal';
  
  // Reset the game session
  messageEl.textContent = `Switched to ${isHardMode ? 'Hard' : 'Normal'} mode. Game reset!`;
  messageEl.className = 'message-correct';
  
  setTimeout(() => {
    resetSession();
    startRound();
  }, 1500);
});

// Start
init();
