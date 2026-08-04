/**
 * ui.js
 * Handles all DOM interaction, rendering, and animation for the simulator.
 *
 * This file is the "bridge" between the HTML structure (index.html),
 * the cache logic (cache-engine.js), and the comparison module (comparison.js).
 * It does NOT perform any cache calculations - it only reads results from
 * CacheEngine and displays them on screen.
 *
 * Main responsibilities:
 *  - Reading user input (config dropdowns, sequence textarea, buttons)
 *  - Running and controlling the simulation (step, auto-play, pause, reset)
 *  - Rendering the cache grid, trace log, statistics, and comparison panel
 *  - Managing application state through the AppState object
 */

//  App State 
// This object is the single source of truth for what the app is doing.
// Only this file should modify it.
const AppState = {
  engine:     null,   // active CacheEngine instance
  sequence:   [],     // current block address sequence
  log:        [],     // full log returned by engine.simulate()
  stepIndex:  0,      // how many steps have been shown so far
  animTimer:  null,   // setInterval handle for auto-play (null = not running)
  animSpeed:  600,    // ms between steps during auto-play

  compareData: null,  // { lru: {...}, mru: {...} } from runComparison()
  compareView: 'LRU', // which policy is currently shown in the compare panel
};


//  DOM References 
// We look up each element once on page load and store it here.
// Always use DOM.xxx rather than calling document.getElementById every time.
const DOM = {};

// Audio
const SFX = {
  step:     null,
  complete: null,

  /**
   * Initializes audio references after the DOM is loaded.
   * Called once in the DOMContentLoaded listener.
   */
  init() {
    this.step     = document.getElementById('sfx-step');
    this.complete = document.getElementById('sfx-complete');
  },

  /**
   * Plays the given sound from the beginning.
   * Silently fails if the file isn't loaded or the browser blocks autoplay.
   * @param {'step'|'complete'} name
   */
  play(name) {
    const audio = this[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {}); // ignore autoplay block errors
  },
};

/**
 * Looks up and stores references to all required DOM elements.
 * Called once on page load. All other functions access elements
 * through the DOM object rather than querying the document each time.
 */
function cacheDOMRefs() {
  // Config inputs
  DOM.numBlocks  = document.getElementById('num-blocks');
  DOM.blockSize  = document.getElementById('block-size');
  DOM.policy     = document.getElementById('policy');
  DOM.readPolicy = document.getElementById('read-policy');
  DOM.configInfo = document.getElementById('config-info');

  // Sequence
  DOM.seqInput    = document.getElementById('seq-input');
  DOM.seqBtnSeq   = document.getElementById('btn-seq');
  DOM.seqBtnMid   = document.getElementById('btn-mid');
  DOM.seqBtnRand  = document.getElementById('btn-rand');
  DOM.seqBtnCustom= document.getElementById('btn-custom');
  DOM.seqDisplay  = document.getElementById('seq-display');

  // Controls
  DOM.btnRun     = document.getElementById('btn-run');
  DOM.btnStep    = document.getElementById('btn-step');
  DOM.btnAuto    = document.getElementById('btn-auto');
  DOM.btnPause   = document.getElementById('btn-pause');
  DOM.btnFinal   = document.getElementById('btn-final');
  DOM.btnReset   = document.getElementById('btn-reset');
  DOM.btnCompare = document.getElementById('btn-compare');
  DOM.speedSlider= document.getElementById('speed-slider');
  DOM.speedLabel = document.getElementById('speed-label');

  // Progress
  DOM.progressBar = document.getElementById('progress-bar');
  DOM.progressText= document.getElementById('progress-text');
  DOM.currentAccess=document.getElementById('current-access');

  // Cache grid
  DOM.cacheGrid   = document.getElementById('cache-grid');

  // Stats
  DOM.statTotal    = document.getElementById('stat-total');
  DOM.statHits     = document.getElementById('stat-hits');
  DOM.statMisses   = document.getElementById('stat-misses');
  DOM.statHitRate  = document.getElementById('stat-hit-rate');
  DOM.statMissRate = document.getElementById('stat-miss-rate');
  DOM.statAmat     = document.getElementById('stat-amat');
  DOM.statTotalTime= document.getElementById('stat-total-time');

  // Text Log
  DOM.logContainer = document.getElementById('log-container');

  // Comparison
  DOM.comparePanel = document.getElementById('compare-panel');
  DOM.compareTable = document.getElementById('compare-table');
  DOM.cmpBtnLru    = document.getElementById('cmp-btn-lru');
  DOM.cmpBtnMru    = document.getElementById('cmp-btn-mru');
}


// Config Helpers
/**
 * Read the current config form values and return a config object
 * that can be passed directly to new CacheEngine(config).
 * @returns {Object}
 */
function getConfig() {
  return {
    numCacheBlocks: parseInt(DOM.numBlocks.value, 10),
    blockSize:      parseInt(DOM.blockSize.value, 10),
    policy:         DOM.policy.value,
    readPolicy:     DOM.readPolicy.value,
  };
}

/**
 * Reads the current configuration dropdowns and updates the
 * #config-info banner with a formatted summary of the active settings.
 * Called on page load and whenever a dropdown value changes.
 */
function updateConfigInfo() {
  const cfg     = getConfig();
  const numSets = Math.floor(cfg.numCacheBlocks / 8);
  DOM.configInfo.innerHTML =
    `${cfg.numCacheBlocks} blocks &middot; 8-way &middot; ` +
    `${numSets} set${numSets === 1 ? '' : 's'} &middot; ` +
    `Block size: ${cfg.blockSize} words &middot; ` +
    `Policy: ${cfg.policy} &middot; Read: ${cfg.readPolicy}`;
}


// Sequence Helpers
/**
 * Stores the given sequence in AppState, fills the sequence textarea,
 * and updates the preview label with the access count and a short preview.
 * @param {number[]} seq - array of block addresses to load
 */
function setSequence(seq) {
  AppState.sequence = seq;
  DOM.seqInput.value = seq.join(', ');

  if (seq.length === 0) {
    DOM.seqDisplay.textContent = 'No sequence loaded.';
  } else {
    const preview = seq.slice(0, 12).join(', ');
    const suffix  = seq.length > 12 ? ', …' : '';
    DOM.seqDisplay.textContent = `${seq.length} accesses: ${preview}${suffix}`;
  }
}


// Engine Bootstrap
/**
 * Initializes and runs a new simulation using the current config and sequence.
 * Stops any active auto-play, creates a fresh CacheEngine, runs the full
 * sequence, and resets the display (cache grid, log, stats, progress bar).
 * Returns true on success, false if the sequence is empty or config is invalid.
 *
 * @returns {boolean}
 */
function initSimulation() {
  stopAuto();

  if (!AppState.sequence || AppState.sequence.length === 0) {
    alert('Please load a sequence first (Sequential, Mid-Repeat, Random, or Custom).');
    return false;
  }

  const cfg = getConfig();
  let engine;
  try {
    engine = new CacheEngine(cfg);
  } catch (err) {
    alert('Configuration error: ' + err.message);
    return false;
  }

  AppState.engine    = engine;
  AppState.log       = engine.simulate(AppState.sequence);
  AppState.stepIndex = 0;

  clearLog();
  const numSets = Math.floor(cfg.numCacheBlocks / 8);
  renderEmptyCacheGrid(numSets);
  updateStatsFromLog();
  updateProgress(0, AppState.log.length);
  DOM.currentAccess.textContent = '–';

  return true;
}


// Step Execution
/**
 * Advances the simulation display by exactly one step.
 * Reads the next log entry, renders the cache grid update, appends a log
 * entry, and refreshes the stats panel and progress bar.
 *
 * @returns {boolean} true if more steps remain, false if this was the last
 */
function stepForward() {
  if (!AppState.log || AppState.stepIndex >= AppState.log.length) {
    return false;
  }

  const entry = AppState.log[AppState.stepIndex];
  AppState.stepIndex++;
  SFX.play('step');

  appendLogEntry(entry);
  renderCacheState(entry);
  updateStatsFromLog();
  updateProgress(AppState.stepIndex, AppState.log.length);

  DOM.currentAccess.textContent =
    `Access #${entry.accessNum}: Block ${entry.blockAddr} → Set ${entry.setIndex}, Tag ${entry.tag} → ${entry.result}`;

  return AppState.stepIndex < AppState.log.length;
}

/**
 * Jumps directly to the end of the simulation without stepping through.
 * Renders the full trace log, final cache grid state, and complete statistics
 * all at once. Initializes the simulation first if it hasn't been run yet.
 */
function showFinalSnapshot() {
  if (!AppState.log || AppState.log.length === 0) {
    if (!initSimulation()) return;
  }

  AppState.stepIndex = AppState.log.length;

  clearLog();
  AppState.log.forEach(appendLogEntry);

  renderFinalCacheGrid();
  updateStatsFromLog();
  SFX.play('complete');
  updateProgress(AppState.log.length, AppState.log.length);

  const last = AppState.log[AppState.log.length - 1];
  DOM.currentAccess.textContent = last
    ? `Access #${last.accessNum}: Block ${last.blockAddr} → Set ${last.setIndex}, Tag ${last.tag} → ${last.result}`
    : '–';
}


// Auto-Play
/**
 * Starts the auto-play animation using setInterval.
 * Steps forward automatically at the interval defined by AppState.animSpeed.
 * Stops and unlocks the Compare button when the last step is reached.
 */
function startAuto() {
  if (AppState.animTimer) return; // already running

  DOM.btnAuto.disabled  = true;
  DOM.btnPause.disabled = false;
  DOM.btnStep.disabled = true;

  AppState.animTimer = setInterval(() => {
    const hasMore = stepForward();
    if (!hasMore) {
      stopAuto();
      DOM.btnStep.disabled = true;
      DOM.btnAuto.disabled = true;
      DOM.btnCompare.disabled = false; // Auto-play finished (unlock Compare Policies)
      SFX.play('complete');
    }
  }, AppState.animSpeed);
}

/**
 * Stops the auto-play animation by clearing the active interval.
 * Re-enables the Step button if there are still steps remaining.
 */
function stopAuto() {
  if (AppState.animTimer) {
    clearInterval(AppState.animTimer);
    AppState.animTimer = null;
  }
  // Guard: DOM may not be wired yet on very first call.
  if (DOM.btnAuto)  DOM.btnAuto.disabled  = false;
  if (DOM.btnPause) DOM.btnPause.disabled = true;
  if (DOM.btnStep && AppState.log && AppState.stepIndex < AppState.log.length) {
    DOM.btnStep.disabled = false;
  }
}


// Cache Grid Rendering
/**
 * Renders an empty cache grid skeleton with all ways set to invalid.
 * Builds one .cache-set card per set, each containing 8 .cache-line rows
 * with dashes for all fields. Called at the start of each new simulation.
 *
 * @param {number} numSets - number of set cards to render
 */
function renderEmptyCacheGrid(numSets) {
  DOM.cacheGrid.innerHTML = '';

  const emptyLine = { valid: false, tag: null, blockNum: null, order: 0 };
  const emptyLines = Array.from({ length: WAYS }, () => emptyLine);

  for (let s = 0; s < numSets; s++) {
    DOM.cacheGrid.appendChild(buildSetCardEl(s, emptyLines, {}, 'cache-set'));
  }
}

/**
 * Builds and returns a single cache line DOM element.
 * Applies the appropriate highlight class based on whether this line
 * was a hit, miss, eviction, or untouched in the current step.
 *
 * @param {number} setIdx   - index of the parent set (used for element ID)
 * @param {number} wayIdx   - way number within the set (0–7)
 * @param {Object} lineData - { valid, tag, blockNum, order }
 * @param {string} highlight - 'hit' | 'miss' | 'evicted' | 'none'
 * @returns {HTMLElement}
 */
function buildCacheLineEl(setIdx, wayIdx, lineData, highlight) {
  const el = document.createElement('div');
  el.className = 'cache-line';

  if (highlight === 'hit')     el.classList.add('cache-hit');
  if (highlight === 'miss')    el.classList.add('cache-miss');
  if (highlight === 'evicted') el.classList.add('cache-evicted');

  const wayCell   = document.createElement('span');
  wayCell.className = 'cl-way';
  wayCell.textContent = `W${wayIdx}`;

  const validCell = document.createElement('span');
  validCell.className = 'cl-valid ' + (lineData.valid ? 'valid-yes' : 'valid-no');
  validCell.textContent = lineData.valid ? '1' : '0';

  const tagCell   = document.createElement('span');
  tagCell.className = 'cl-tag';
  tagCell.textContent = lineData.valid ? lineData.tag : '—';

  const blockCell = document.createElement('span');
  blockCell.className = 'cl-block';
  blockCell.textContent = lineData.valid ? lineData.blockNum : '—';

  const orderCell = document.createElement('span');
  orderCell.className = 'cl-order';
  orderCell.textContent = lineData.valid ? lineData.order : '—';

  el.appendChild(wayCell);
  el.appendChild(validCell);
  el.appendChild(tagCell);
  el.appendChild(blockCell);
  el.appendChild(orderCell);

  return el;
}

/**
 * Builds and returns one cache set card containing a header and 8 cache line rows.
 * Shared by the main cache grid, the final snapshot view, and the compare panel
 * to avoid duplicating the set card layout in multiple places.
 *
 * @param {number} setIdx        - set number shown in the card header (e.g. "Set 0")
 * @param {Object[]} setLines    - array of 8 line objects { valid, tag, blockNum, order }
 * @param {Object} highlightMap  - maps way index to highlight type: { [wayIdx]: 'hit'|'miss'|'evicted' }
 * @param {string} idPrefix      - prefix for the card's DOM id (e.g. 'cache-set' or 'cmp-set')
 * @returns {HTMLElement}
 */
function buildSetCardEl(setIdx, setLines, highlightMap, idPrefix) {
  const card = document.createElement('div');
  card.className = 'cache-set';
  card.id = `${idPrefix}-${setIdx}`;

  const header = document.createElement('div');
  header.className = 'set-header';
  header.textContent = `Set ${setIdx}`;
  card.appendChild(header);

  for (let way = 0; way < WAYS; way++) {
    const highlight = highlightMap[way] || 'none';
    card.appendChild(buildCacheLineEl(setIdx, way, setLines[way], highlight));
  }

  return card;
}

/**
 * Updates only the affected set card in the cache grid after a single step.
 * Reads the line states from entry.snapshot and applies hit/miss/eviction
 * highlights to the appropriate way. Scrolls the set into view smoothly.
 *
 * @param {Object} entry - log entry returned by CacheEngine.access()
 */
function renderCacheState(entry) {
  const highlightMap = {};

  if (entry.result === 'HIT') {
    highlightMap[entry.hitLine] = 'hit';
  } else if (entry.evicted) {
    // this way was both the eviction target AND the load destination
    highlightMap[entry.evicted.line] = 'evicted';
  } else if (entry.loadedLine !== null) {
    highlightMap[entry.loadedLine] = 'miss';
  }

  const newCard = buildSetCardEl(entry.setIndex, entry.snapshot, highlightMap, 'cache-set');
  const oldCard = document.getElementById(`cache-set-${entry.setIndex}`);

  if (oldCard) {
    oldCard.replaceWith(newCard);
  } else {
    DOM.cacheGrid.appendChild(newCard);
  }

  if (newCard.scrollIntoView) {
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Renders the complete final cache state across all sets.
 * Rebuilds the entire cache grid from getCacheState() with no highlights.
 * Used by the Final Snapshot button and showFinalSnapshot().
 */
function renderFinalCacheGrid() {
  if (!AppState.engine) return;

  const state = AppState.engine.getCacheState(); // 2D array [numSets][ways]
  DOM.cacheGrid.innerHTML = '';

  state.forEach((setLines, idx) => {
    DOM.cacheGrid.appendChild(buildSetCardEl(idx, setLines, {}, 'cache-set'));
  });
}


// Stats Rendering
/**
 * Recomputes and displays statistics based on the steps shown so far.
 * Slices the log up to the current stepIndex, counts hits and misses,
 * and applies the correct AMAT formula based on the active read policy.
 * Shows dashes for all stats if no steps have been taken yet.
 */
function updateStatsFromLog() {
  const slice = AppState.log.slice(0, AppState.stepIndex);
  const total  = slice.length;
 
  // Reset stats display to blank when no steps have been taken yet
  if (total === 0) {
    updateStats({
      totalAccesses: 0,
      hits:          0,
      misses:        0,
      hitRate:       '—',
      missRate:      '—',
      amat:          '—',
      totalTime:     '—',
    });
    return;
  }
 
  const hits   = slice.filter(e => e.result === 'HIT').length;
  const misses = total - hits;

  const hitRateRaw  = total > 0 ? hits / total : 0;
  const missRateRaw = total > 0 ? misses / total : 0;

  const readPolicy = AppState.engine ? AppState.engine.readPolicy : 'non-load-through';
  const Tc = 1;
  const Tm = 10;

  const amatRaw = readPolicy === 'load-through'
    ? (hitRateRaw * Tc) + (missRateRaw * Tm)
    : Tc + (missRateRaw * Tm);

  const totalTimeRaw = total * amatRaw;

  updateStats({
    totalAccesses: total,
    hits:          hits,
    misses:        misses,
    hitRate:       `${(hitRateRaw * 100).toFixed(2)}%`,
    missRate:      `${(missRateRaw * 100).toFixed(2)}%`,
    amat:          `${amatRaw.toFixed(4)} ns`,
    totalTime:     `${totalTimeRaw.toFixed(2)} ns`,
  });
}

/**
 * Writes the given statistics values into the stats panel DOM elements.
 *
 * @param {Object} s
 * @param {number|string} s.totalAccesses
 * @param {number|string} s.hits
 * @param {number|string} s.misses
 * @param {string} s.hitRate   - e.g. "75.00%"
 * @param {string} s.missRate  - e.g. "25.00%"
 * @param {string} s.amat      - e.g. "3.5000 ns"
 * @param {string} s.totalTime - e.g. "224.00 ns"
 */
function updateStats(s) {
  DOM.statTotal.textContent     = s.totalAccesses;
  DOM.statHits.textContent      = s.hits;
  DOM.statMisses.textContent    = s.misses;
  DOM.statHitRate.textContent   = s.hitRate;
  DOM.statMissRate.textContent  = s.missRate;
  DOM.statAmat.textContent      = s.amat;
  DOM.statTotalTime.textContent = s.totalTime;
}


// Progress Bar 
/**
 * Update the progress bar width and the "current / total" label.
 * @param {number} current
 * @param {number} total
 */
function updateProgress(current, total) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  DOM.progressBar.style.width  = pct + '%';
  DOM.progressText.textContent = `${current} / ${total}`;
}


// Text Log
/** Clear all entries from the log panel. */
function clearLog() {
  DOM.logContainer.innerHTML = '';
}

/**
 * Builds and returns a log entry DOM element for the given access.
 * Shows the access number, HIT/MISS badge, block/set/tag details, policy,
 * and an eviction detail line if a block was replaced during this access.
 * Used by both the main trace log and the comparison panel's full log.
 *
 * @param {Object} entry - log entry returned by CacheEngine.access()
 * @returns {HTMLElement}
 */
function buildLogEntryEl(entry) {
  const div = document.createElement('div');
  div.className = 'log-entry ' + (entry.result === 'HIT' ? 'log-hit' : 'log-miss');

  const header = document.createElement('div');
  header.className = 'log-header';

  const num = document.createElement('span');
  num.className = 'log-num';
  num.textContent = `Access #${entry.accessNum}`;

  const badge = document.createElement('span');
  badge.className = 'log-badge ' + (entry.result === 'HIT' ? 'log-badge-hit' : 'log-badge-miss');
  badge.textContent = entry.result;

  header.appendChild(num);
  header.appendChild(badge);

  const body = document.createElement('div');
  body.className = 'log-body';
  body.innerHTML =
    `Block <strong>${entry.blockAddr}</strong> → Set ${entry.setIndex}, Tag ${entry.tag}` +
    ` &middot; Policy: ${entry.policy} &middot; Read: ${entry.readPolicy}` +
    (entry.result === 'HIT'
      ? ` &middot; Hit in way ${entry.hitLine}`
      : ` &middot; Loaded into way ${entry.loadedLine}`);

  div.appendChild(header);
  div.appendChild(body);

  if (entry.evicted) {
    const evictLine = document.createElement('div');
    evictLine.className = 'log-evict';
    evictLine.textContent =
      `⚠ Evicted way ${entry.evicted.line}: block ${entry.evicted.blockNum} ` +
      `(tag ${entry.evicted.tag}) — ${entry.evicted.reason}`;
    div.appendChild(evictLine);
  }

  return div;
}

function appendLogEntry(entry) {
  DOM.logContainer.appendChild(buildLogEntryEl(entry));
  DOM.logContainer.scrollTop = DOM.logContainer.scrollHeight;
}


/**
 * Highlight the active preset button in the Sequential/Mid-Repeat/Random
 * segmented control (.seq-type-btns .is-active). Pass null to clear all
 * (used when a custom sequence is loaded instead).
 * @param {HTMLElement|null} activeBtn
 */
function setActiveSeqButton(activeBtn) {
  [DOM.seqBtnSeq, DOM.seqBtnMid, DOM.seqBtnRand].forEach(btn => {
    btn.classList.toggle('is-active', btn === activeBtn);
  });
}

/**
 * Clear the compare panel back to its initial, hidden state - used by Reset
 * so a stale LRU/MRU comparison from a previous run doesn't linger on screen.
 */
function hideComparePanel() {
  AppState.compareData = null;
  AppState.compareView = 'LRU';
  DOM.compareTable.innerHTML = '';
  DOM.cmpBtnLru.classList.remove('is-active');
  DOM.cmpBtnMru.classList.remove('is-active');
  DOM.comparePanel.style.display = 'none';
}

// Comparison Rendering
/**
 * Render the Compare panel for whichever policy is currently toggled
 * (AppState.compareView: 'LRU' or 'MRU'). Both engines already ran on
 * the same sequence via runComparison() - this only decides which one's
 * full results (stats + final cache grid + full log) get shown.
 * LRU and MRU are never displayed side by side.
 */
function renderComparePanel() {
  if (!AppState.compareData) return;

  DOM.comparePanel.style.display = 'block';

  const view = AppState.compareView; // 'LRU' or 'MRU'
  const data = view === 'LRU' ? AppState.compareData.lru : AppState.compareData.mru;

  // Toggle button active state - reuses the same .is-active pattern as
  // the Sequential/Mid-Repeat/Random segmented control.
  DOM.cmpBtnLru.classList.toggle('is-active', view === 'LRU');
  DOM.cmpBtnMru.classList.toggle('is-active', view === 'MRU');

  // One-line "which policy wins overall" summary, based on AMAT (lower is better).
  const rows = buildComparisonTable(AppState.compareData);
  const amatRow = rows.find(r => r.metric === 'AMAT');
  const viewedSpan = `<span class="win-${view.toLowerCase()}">${data.policy}</span>`;
  const summaryText = amatRow.winner === 'tie'
    ? `Currently viewing ${viewedSpan}. Both policies tie on AMAT for this sequence.`
    : `Currently viewing ${viewedSpan}. Faster overall (lower AMAT): <span class="win-${amatRow.winner.toLowerCase()}">${amatRow.winner}</span>.`;

  // Rebuild the panel body for the selected policy only.
  // followed by the detailed view for the selected policy.
  const allRows = buildComparisonTable(AppState.compareData);
  const tableRowsHTML = allRows
    .filter(r => r.metric !== 'Total Accesses') // total is always a tie, not useful here
    .map(r => {
      const lruWins = r.winner === 'LRU';
      const mruWins = r.winner === 'MRU';
      return `
        <tr>
          <td class="cmp-metric">${r.metric}</td>
          <td class="${lruWins ? 'winner-cell' : ''}">${r.lru}${lruWins ? ' 🏆' : ''}</td>
          <td class="${mruWins ? 'winner-cell' : ''}">${r.mru}${mruWins ? ' 🏆' : ''}</td>
        </tr>`;
    }).join('');

  // Rebuild the panel body: side-by-side table first then the toggle detail view
  DOM.compareTable.innerHTML = `
    <div class="compare-summary">${summaryText}</div>

    <table class="comp-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th class="win-lru">LRU</th>
          <th class="win-mru">MRU</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHTML}
      </tbody>
    </table>

    <div class="compare-toggle-header">View Detailed Results:</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Accesses</div><div class="stat-value">${data.stats.totalAccesses}</div></div>
      <div class="stat-card cmp-stat-hits"><div class="stat-label">Cache Hits</div><div class="stat-value">${data.stats.hits}</div></div>
      <div class="stat-card cmp-stat-misses"><div class="stat-label">Cache Misses</div><div class="stat-value">${data.stats.misses}</div></div>
      <div class="stat-card cmp-stat-hit-rate"><div class="stat-label">Hit Rate</div><div class="stat-value">${data.stats.hitRate}</div></div>
      <div class="stat-card cmp-stat-miss-rate"><div class="stat-label">Miss Rate</div><div class="stat-value">${data.stats.missRate}</div></div>
      <div class="stat-card"><div class="stat-label">AMAT</div><div class="stat-value">${data.stats.amat}</div></div>
      <div class="stat-card"><div class="stat-label">Total Access Time</div><div class="stat-value">${data.stats.totalTime}</div></div>
    </div>
    <div class="compare-subheader">Final Cache State — ${data.policy}</div>
    <div id="compare-grid"></div>
    <div class="compare-subheader">Full Access Log — ${data.policy}</div>
    <div id="compare-log"></div>
  `;

  // Populate the final cache grid for this policy.
  const gridEl = document.getElementById('compare-grid');
  data.finalState.forEach((setLines, idx) => {
    gridEl.appendChild(buildSetCardEl(idx, setLines, {}, 'cmp-set'));
  });

  // Populate the full log for this policy.
  const logEl = document.getElementById('compare-log');
  data.log.forEach(entry => {
    logEl.appendChild(buildLogEntryEl(entry));
  });

  if (DOM.comparePanel.scrollIntoView) {
    DOM.comparePanel.scrollIntoView({ behavior: 'smooth' });
  }
}


// Event Wiring
/**
 * Attaches all event listeners to the UI controls.
 * Called once on DOMContentLoaded. Wires config dropdowns, sequence buttons,
 * simulation controls (Run/Step/Auto/Pause/Final/Reset), speed slider,
 * Compare button, and the LRU/MRU toggle buttons in the compare panel.
 */
function wireEvents() {
  // Config change
  [DOM.numBlocks, DOM.blockSize, DOM.policy, DOM.readPolicy].forEach(el => {
    el.addEventListener('change', updateConfigInfo);
  });

  // Sequence buttons
  DOM.seqBtnSeq.addEventListener('click', () => {
    const n = parseInt(DOM.numBlocks.value, 10);
    setSequence(generateSequential(n));
    setActiveSeqButton(DOM.seqBtnSeq);
  });

  DOM.seqBtnMid.addEventListener('click', () => {
    const n = parseInt(DOM.numBlocks.value, 10);
    setSequence(generateMidRepeat(n));
    setActiveSeqButton(DOM.seqBtnMid);
  });

  DOM.seqBtnRand.addEventListener('click', () => {
    setSequence(generateRandom());
    setActiveSeqButton(DOM.seqBtnRand);
  });

  DOM.seqBtnCustom.addEventListener('click', () => {
    const parsed = parseCustomSequence(DOM.seqInput.value);
    if (parsed.length === 0) {
      alert('No valid block addresses found. Enter integers from 0–1023, separated by commas or spaces.');
      return;
    }
    setSequence(parsed);
    setActiveSeqButton(null); // custom sequence - none of the three presets apply
  });

  // Simulation controls
  DOM.btnRun.addEventListener('click', () => {
    // Guard against a live/paused simulation regardless of the button's
    // disabled state 
    if (AppState.log && AppState.log.length > 0) {
      return;
    }

    const ok = initSimulation();
    if (ok) {
      DOM.btnRun.disabled   = true; 
      DOM.btnStep.disabled  = false;
      DOM.btnAuto.disabled  = false;
      DOM.btnPause.disabled = true;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
      DOM.btnCompare.disabled = true; 
    }
  });

  DOM.btnStep.addEventListener('click', () => {
    if (!AppState.log || AppState.log.length === 0) {
      if (!initSimulation()) return;
      DOM.btnRun.disabled   = true; 
      DOM.btnStep.disabled  = false;
      DOM.btnAuto.disabled  = false;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
      DOM.btnCompare.disabled = true; 
    }
    const hasMore = stepForward();
    if (!hasMore) {
      DOM.btnStep.disabled = true;
      DOM.btnAuto.disabled = true;
    }
  });

  DOM.btnAuto.addEventListener('click', () => {
    if (!AppState.log || AppState.log.length === 0) {
      if (!initSimulation()) return;
      DOM.btnRun.disabled   = true; 
      DOM.btnStep.disabled  = false;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
      DOM.btnCompare.disabled = true; 
    }
    if (AppState.stepIndex >= AppState.log.length) return; // already finished
    startAuto();
  });

  DOM.btnPause.addEventListener('click', () => {
    stopAuto();
  });

  DOM.btnFinal.addEventListener('click', () => {
    showFinalSnapshot();
    DOM.btnStep.disabled  = true;
    DOM.btnAuto.disabled  = true;
    DOM.btnPause.disabled = true;
    DOM.btnReset.disabled = false;
    DOM.btnCompare.disabled = false;
  });

  DOM.btnReset.addEventListener('click', () => {
    stopAuto();

    AppState.engine    = null;
    AppState.log       = [];
    AppState.stepIndex = 0;

    clearLog();
    DOM.cacheGrid.innerHTML = '<p class="grid-placeholder">Run a simulation to see the cache state.</p>';
    updateStats({
      totalAccesses: '—', hits: '—', misses: '—',
      hitRate: '—', missRate: '—', amat: '—', totalTime: '—',
    });
    updateProgress(0, 0);
    DOM.currentAccess.textContent = '–';
    hideComparePanel();

    // Clears the compared analysis when simulation is reset
    setSequence([]);
    setActiveSeqButton(null);

    DOM.btnRun.disabled   = false;
    DOM.btnStep.disabled  = true;
    DOM.btnAuto.disabled  = false;
    DOM.btnPause.disabled = true;
    DOM.btnFinal.disabled = true;
    DOM.btnReset.disabled = true;
    DOM.btnCompare.disabled = true;
  });

  DOM.speedSlider.addEventListener('input', () => {
    const val = parseInt(DOM.speedSlider.value, 10);
    AppState.animSpeed = 1050 - val * 100; // 1–10 -> slower..faster
    DOM.speedLabel.textContent = `${val}×`;

    if (AppState.animTimer) {
      stopAuto();
      startAuto();
    }
  });

  DOM.btnCompare.addEventListener('click', () => {
    if (!AppState.sequence || AppState.sequence.length === 0) {
      alert('Please load a sequence first (Sequential, Mid-Repeat, Random, or Custom).');
      return;
    }
     if (!AppState.log || AppState.log.length === 0) {         
    alert('Please run the simulation first (Run, Step, Auto-Play, or Final Snapshot) before comparing policies.');
    return;
  }

    const cfg = getConfig();
    const baseConfig = {
      numCacheBlocks: cfg.numCacheBlocks,
      blockSize:      cfg.blockSize,
      readPolicy:     cfg.readPolicy,
    };

    try {
      AppState.compareData = runComparison(AppState.sequence, baseConfig);
    } catch (err) {
      alert('Comparison error: ' + err.message);
      return;
    }

    AppState.compareView = 'LRU'; // always start on LRU when a new comparison runs
    renderComparePanel();
  });

  // Compare panel toggle buttons - switch which single policy is displayed
  DOM.cmpBtnLru.addEventListener('click', () => {
    if (!AppState.compareData) return;
    AppState.compareView = 'LRU';
    renderComparePanel();
  });

  DOM.cmpBtnMru.addEventListener('click', () => {
    if (!AppState.compareData) return;
    AppState.compareView = 'MRU';
    renderComparePanel();
  });
}


// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  cacheDOMRefs();
  SFX.init();
  updateConfigInfo();
  wireEvents();

  // Disable buttons that require an active simulation
  DOM.btnStep.disabled  = true;
  DOM.btnAuto.disabled  = false; 
  DOM.btnPause.disabled = true;
  DOM.btnFinal.disabled = true;
  DOM.btnReset.disabled = true;
  DOM.btnCompare.disabled = true;
});