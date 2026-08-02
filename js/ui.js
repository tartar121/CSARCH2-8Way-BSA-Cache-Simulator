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
  // TODO: implement this build the string and write it to DOM.configInfo.innerHTML
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
  // TODO: implement this update DOM.seqInput.value and DOM.seqDisplay.textContent
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
  // TODO: implement this implement this
  return false;
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
  // TODO: implement this implement this
  return false;
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
  // TODO: implement this implement this
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
  // TODO: implement this implement this
}

/**
 * // TODO: implement this
 * Stop auto-play by clearing the interval.
 * Set AppState.animTimer to null.
 * Update button disabled states (Pause disabled, Auto enabled).
 */
function stopAuto() {
  // TODO: implement this implement this
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
  // TODO: implement this implement this
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
  // TODO: implement this implement this
  const el = document.createElement('div');
  el.className = 'cache-line';
  return el;
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
  // TODO: implement this implement this
}

/**
 * // TODO: implement this
 * Render the final state of the entire cache.
 * Call engine.getCacheState() to get all sets, then build the grid.
 * No highlights needed (this is a static final view).
 */
function renderFinalCacheGrid() {
  // TODO: implement this implement this
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
  // TODO: implement this implement this
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
function appendLogEntry(entry) {
  // TODO: implement this implement this
}


// Comparison Rendering
/**
 * // TODO: implement this
 * Render the comparison table from buildComparisonTable() rows.
 * Show #compare-panel (set display to 'block').
 * Build an HTML <table> from the rows array and inject into #compare-table.
 *
 * Table columns: Metric | LRU | MRU | Better
 * Apply .winner-cell to the better value's cell.
 * Apply .winner-badge + .win-lru or .win-mru to the Better cell.
 * Scroll the comparison panel into view when done.
 *
 * @param {Object[]} rows - from buildComparisonTable()
 */
function renderComparisonTable(rows) {
  // TODO: implement this implement this
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
    // TODO: implement this get n from DOM.numBlocks.value, call generateSequential(n)
  });

  DOM.seqBtnMid.addEventListener('click', () => {
    // TODO: implement this get n from DOM.numBlocks.value, call generateMidRepeat(n)
  });

  DOM.seqBtnRand.addEventListener('click', () => {
    // TODO: implement this call generateRandom()
  });

  DOM.seqBtnCustom.addEventListener('click', () => {
    // TODO: implement this call parseCustomSequence(DOM.seqInput.value)
    //               alert if result is empty
  });

  // Simulation controls
  DOM.btnRun.addEventListener('click', () => {
    // TODO: implement this call initSimulation(), enable buttons on success
  });

  DOM.btnStep.addEventListener('click', () => {
    // TODO: implement this call stepForward(), disable buttons if done
  });

  DOM.btnAuto.addEventListener('click', () => {
    // TODO: implement this call initSimulation() if log is empty, then startAuto()
  });

  DOM.btnPause.addEventListener('click', () => {
    // TODO: implement this call stopAuto()
  });

  DOM.btnFinal.addEventListener('click', () => {
    // TODO: implement this call showFinalSnapshot()
  });

  DOM.btnReset.addEventListener('click', () => {
    // TODO: implement this stop auto, reset AppState, clear all DOM panels,
    //               disable step/auto/final/reset buttons
  });

  DOM.speedSlider.addEventListener('input', () => {
    const val = parseInt(DOM.speedSlider.value, 10);
    // TODO: implement this convert val (1–10) to ms delay (e.g. 1050 - val*100)
    //               update DOM.speedLabel, restart auto if running
  });

  DOM.btnCompare.addEventListener('click', () => {
    // TODO: implement this
    //   1. Alert if AppState.sequence is empty.
    //   2. Call runComparison(AppState.sequence, getConfig()).
    //   3. Call buildComparisonTable(comparison).
    //   4. Call renderComparisonTable(rows).
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