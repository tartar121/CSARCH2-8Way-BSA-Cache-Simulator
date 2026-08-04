/**
 * ui.js for Member 2
 * All DOM interaction, rendering, and animation logic.
 * This file connects the HTML (Member 1) to the engine (Member 3)
 * and comparison module (Member 4).
 *
 * YOUR JOB:
 *   1. Fill in every function marked with TODO.
 *   2. Do NOT put cache logic here -> call CacheEngine methods instead.
 *   3. Do NOT add or rename HTML element IDs -> use the ones in index.html.
 *   4. If you need a new HTML element, ask Member 1 to add it and update
 *      the SHARED ID LIST at the bottom of index.html.
 *
 * READING ORDER:
 *   Start with AppState and DOM, then wireEvents(), then the rendering
 *   functions (renderCacheState, appendLogEntry, updateStats).
 *   The animation functions (startAuto, stopAuto) come last.
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

/**
 * // TODO: implement this
 * Look up every HTML element that this file needs and store it in DOM.
 * Use the IDs from the SHARED ID LIST at the bottom of index.html.
 *
 * Example:
 *   DOM.numBlocks = document.getElementById('num-blocks');
 *
 * Do this for every single element ui.js reads or writes.
 * Call this function once inside the DOMContentLoaded listener at the bottom.
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
 * // TODO: implement this
 * Update the #config-info banner to summarise the current settings.
 * Called on page load and whenever a config dropdown changes.
 *
 * Example output (innerHTML):
 *   "16 blocks | 8-way | 2 sets | Block size: 4 words | Policy: LRU | Read: non-load-through"
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
 * // TODO: implement this
 * Store the given sequence in AppState, fill the textarea,
 * and update the #seq-display preview label.
 * @param {number[]} seq
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
 * // TODO: implement this
 * Called when the user clicks Run.
 *   1. Stop any running auto-play.
 *   2. Read the config with getConfig().
 *   3. Create a new CacheEngine and wrap in try/catch and alert on error.
 *   4. If AppState.sequence is empty, alert and return false.
 *   5. Call engine.simulate(AppState.sequence) to run the full simulation
 *      and store the result in AppState.log.
 *   6. Reset AppState.stepIndex to 0.
 *   7. Clear the log panel, reset the cache grid to empty, reset stats.
 *   8. Return true on success.
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
 * // TODO: implement this
 * Advance the simulation display by exactly one step.
 *   1. If stepIndex >= log.length, return false (we're done).
 *   2. Get the log entry at AppState.log[AppState.stepIndex].
 *   3. Increment AppState.stepIndex.
 *   4. Call appendLogEntry(entry).
 *   5. Call renderCacheState(entry) to update the grid.
 *   6. Call updateStatsFromLog() to refresh the stats panel.
 *   7. Call updateProgress(stepIndex, log.length).
 *   8. Update DOM.currentAccess with a summary string.
 *   9. Return true if there are more steps, false if this was the last.
 *
 * @returns {boolean} true if more steps remain
 */
function stepForward() {
  if (!AppState.log || AppState.stepIndex >= AppState.log.length) {
    return false;
  }

  const entry = AppState.log[AppState.stepIndex];
  AppState.stepIndex++;

  appendLogEntry(entry);
  renderCacheState(entry);
  updateStatsFromLog();
  updateProgress(AppState.stepIndex, AppState.log.length);

  DOM.currentAccess.textContent =
    `Access #${entry.accessNum}: Block ${entry.blockAddr} → Set ${entry.setIndex}, Tag ${entry.tag} → ${entry.result}`;

  return AppState.stepIndex < AppState.log.length;
}

/**
 * // TODO: implement this
 * Jump directly to the final state.
 *   1. If log is empty, call initSimulation() first.
 *   2. Set stepIndex to log.length.
 *   3. Clear the log and re-append ALL entries at once.
 *   4. Call renderFinalCacheGrid() to show the end state.
 *   5. Call updateStatsFromLog() with the complete log.
 *   6. Update progress to N/N.
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
  updateProgress(AppState.log.length, AppState.log.length);

  const last = AppState.log[AppState.log.length - 1];
  DOM.currentAccess.textContent = last
    ? `Access #${last.accessNum}: Block ${last.blockAddr} → Set ${last.setIndex}, Tag ${last.tag} → ${last.result}`
    : '–';
}


// Auto-Play
/**
 * // TODO: implement this
 * Start auto-play using setInterval.
 * On each tick, call stepForward(). If it returns false, call stopAuto().
 * Store the interval handle in AppState.animTimer.
 * Update button disabled states (Pause enabled, Auto disabled).
 */
function startAuto() {
  if (AppState.animTimer) return; // already running

  DOM.btnAuto.disabled  = true;
  DOM.btnPause.disabled = false;

  AppState.animTimer = setInterval(() => {
    const hasMore = stepForward();
    if (!hasMore) {
      stopAuto();
      DOM.btnStep.disabled = true;
      DOM.btnAuto.disabled = true;
    }
  }, AppState.animSpeed);
}

/**
 * // TODO: implement this
 * Stop auto-play by clearing the interval.
 * Set AppState.animTimer to null.
 * Update button disabled states (Pause disabled, Auto enabled).
 */
function stopAuto() {
  if (AppState.animTimer) {
    clearInterval(AppState.animTimer);
    AppState.animTimer = null;
  }
  // Guard: DOM may not be wired yet on very first call.
  if (DOM.btnAuto)  DOM.btnAuto.disabled  = false;
  if (DOM.btnPause) DOM.btnPause.disabled = true;
}


// Cache Grid Rendering
/**
 * // TODO: implement this
 * Render an empty cache grid skeleton (all lines invalid).
 * Clear #cache-grid and build numSets .cache-set cards,
 * each with 8 .cache-line rows showing valid=0 and dashes.
 *
 * CSS classes to use on each line's cells:
 *   .cl-way  .cl-valid  .cl-tag  .cl-block  .cl-order
 *
 * @param {number} numSets
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
 * // TODO: implement this
 * Build and return a single .cache-line DOM element.
 * Apply .cache-hit, .cache-miss, or .cache-evicted based on highlight param.
 *
 * @param {number} setIdx
 * @param {number} wayIdx
 * @param {Object} lineData  - { valid, tag, blockNum, order }
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
 * Build one .cache-set card (header + 8 .cache-line rows) for a given set.
 * Shared by the main grid, the final-snapshot grid, and the compare panel.
 *
 * @param {number} setIdx
 * @param {Object[]} setLines     - 8 line objects { valid, tag, blockNum, order }
 * @param {Object} highlightMap   - { [wayIdx]: 'hit'|'miss'|'evicted' }
 * @param {string} idPrefix       - DOM id prefix so multiple grids can coexist
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
 * // TODO: implement this
 * After a single step, update only the affected set in the cache grid.
 * Use entry.snapshot to get the current line states for that set.
 * Apply highlights:
 *   - entry.hitLine       → 'hit'
 *   - entry.loadedLine    → 'miss'
 *   - entry.evicted.line  → 'evicted' (if entry.evicted exists)
 *
 * Optionally scroll the affected set into view.
 *
 * @param {Object} entry - log entry from access()
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
 * // TODO: implement this
 * Render the final state of the entire cache.
 * Call engine.getCacheState() to get all sets, then build the grid.
 * No highlights needed (this is a static final view).
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
 * // TODO: implement this
 * Compute and display stats based on how many steps have been shown so far.
 * Slice AppState.log to AppState.stepIndex entries, compute counts,
 * then call updateStats() with the results.
 *
 * Hint: You need the read policy from AppState.engine.readPolicy to pick
 * the right AMAT formula:
 *   non-load-through: AMAT = 1 + (missRate × 10)
 *   load-through:     AMAT = (hitRate × 1) + (missRate × 10)
 */
function updateStatsFromLog() {
  const slice = AppState.log.slice(0, AppState.stepIndex);
  const total  = slice.length;
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
 * Write the given stats values into the stats panel DOM elements.
 * You should not need to change this and just make sure updateStatsFromLog()
 * calls it with the right values.
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
 * // TODO: implement this
 * Build and append one log entry div to #log-container.
 *
 * Each entry must show:
 *   - Access number
 *   - HIT or MISS badge
 *   - Block address, set index, tag, policy, read policy
 *   - If entry.evicted is not null: show which block was evicted and why
 *
 * CSS classes to use (defined in style.css by Member 1):
 *   .log-entry
 *   .log-hit or .log-miss   (based on entry.result)
 *   .log-header, .log-num, .log-badge
 *   .log-badge-hit or .log-badge-miss
 *   .log-body
 *   .log-evict              (for the eviction detail line)
 *
 * Auto-scroll the log to the bottom after appending.
 *
 * @param {Object} entry - log entry from access()
 */
/**
 * Build one .log-entry element for a given log entry.
 * Shared by the main log panel and the compare panel's full log.
 * @param {Object} entry - log entry from access()
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

// Comparison Rendering
/**
 * Render the Compare panel for whichever policy is currently toggled
 * (AppState.compareView: 'LRU' or 'MRU'). Both engines already ran on
 * the same sequence via runComparison() — this only decides which one's
 * full results (stats + final cache grid + full log) get shown.
 * LRU and MRU are never displayed side by side.
 */
function renderComparePanel() {
  if (!AppState.compareData) return;

  DOM.comparePanel.style.display = 'block';

  const view = AppState.compareView; // 'LRU' or 'MRU'
  const data = view === 'LRU' ? AppState.compareData.lru : AppState.compareData.mru;

  // Toggle button active state — reuses the same .is-active pattern as
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
  DOM.compareTable.innerHTML = `
    <div class="compare-summary">${summaryText}</div>
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
 * // TODO: implement this
 * Attach all event listeners. Called once on DOMContentLoaded.
 *
 * Events to wire:
 *   Config dropdowns → updateConfigInfo()
 *   #btn-seq   → setSequence(generateSequential(n))
 *   #btn-mid   → setSequence(generateMidRepeat(n))
 *   #btn-rand  → setSequence(generateRandom())
 *   #btn-custom→ parse textarea, call setSequence() or alert if empty
 *   #btn-run   → initSimulation(), enable step/auto/final/reset buttons
 *   #btn-step  → stepForward(), disable if done
 *   #btn-auto  → initSimulation() if needed, then startAuto()
 *   #btn-pause → stopAuto()
 *   #btn-final → showFinalSnapshot()
 *   #btn-reset → stopAuto(), clear everything, disable controls
 *   #speed-slider → update AppState.animSpeed, restart auto if running
 *   #btn-compare  → run runComparison(), then renderComparisonTable()
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
    setActiveSeqButton(null); // custom sequence — none of the three presets apply
  });

  // Simulation controls
  DOM.btnRun.addEventListener('click', () => {
    const ok = initSimulation();
    if (ok) {
      DOM.btnStep.disabled  = false;
      DOM.btnAuto.disabled  = false;
      DOM.btnPause.disabled = true;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
    }
  });

  DOM.btnStep.addEventListener('click', () => {
    if (!AppState.log || AppState.log.length === 0) {
      if (!initSimulation()) return;
      DOM.btnStep.disabled  = false;
      DOM.btnAuto.disabled  = false;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
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
      DOM.btnStep.disabled  = false;
      DOM.btnFinal.disabled = false;
      DOM.btnReset.disabled = false;
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

    DOM.btnStep.disabled  = true;
    DOM.btnAuto.disabled  = false;
    DOM.btnPause.disabled = true;
    DOM.btnFinal.disabled = true;
    DOM.btnReset.disabled = true;
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

  // Compare panel toggle buttons — switch which single policy is displayed
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
  updateConfigInfo();
  wireEvents();

  // Disable buttons that require an active simulation
  DOM.btnStep.disabled  = true;
  DOM.btnAuto.disabled  = false;  // Auto can also trigger init
  DOM.btnPause.disabled = true;
  DOM.btnFinal.disabled = true;
  DOM.btnReset.disabled = true;
});