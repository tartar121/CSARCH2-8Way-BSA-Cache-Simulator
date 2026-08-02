/**
 * comparison.js for Member 4
 * Runs the same sequence through both LRU and MRU, then builds a
 * comparison table data structure for ui.js to render.
 *
 *     No DOM access here. These are pure functions.
 *     ui.js calls runComparison() and passes the result to
 *     renderComparisonTable().
 *
 * YOUR JOB:
 *   1. Fill in runComparison().
 *   2. Fill in buildComparisonTable().
 *   3. Make sure your table rows match the CONTRACT below.
 */


/**
 * // TODO: implement this
 * Run the same sequence through both LRU and MRU policies.
 * Returns results for both so ui.js can display the comparison.
 *
 * Steps:
 *   1. Create a CacheEngine with policy='LRU' using baseConfig.
 *   2. Call engine.simulate(sequence) to run it.
 *   3. Grab engine.getStats() and engine.getCacheState().
 *   4. Repeat for policy='MRU'.
 *   5. Return both results.
 *
 * @param {number[]} sequence    - block access sequence to test
 * @param {Object}   baseConfig  - config WITHOUT policy field:
 *                                 { numCacheBlocks, blockSize, readPolicy }
 * @returns {{ lru: Object, mru: Object }}
 *
 * Shape of each value (lru / mru):
 * {
 *   policy:     string,    // 'LRU' or 'MRU'
 *   stats:      Object,    // from engine.getStats()
 *   log:        Object[],  // from engine.simulate()
 *   finalState: Object[][], // from engine.getCacheState()
 * }
 */
function runComparison(sequence, baseConfig) {
  // TODO: implement this
  const lruConfig = {
    numCacheBlocks: baseConfig.numCacheBlocks,
    blockSize:      baseConfig.blockSize,
    readPolicy:     baseConfig.readPolicy,
    policy:         'LRU',
  };
  const lruEngine = new CacheEngine(lruConfig);
  const lruLog    = lruEngine.simulate(sequence);
  const lruStats  = lruEngine.getStats();
  const lruState  = lruEngine.getCacheState();

  const mruConfig = {
    numCacheBlocks: baseConfig.numCacheBlocks,
    blockSize:      baseConfig.blockSize,
    readPolicy:     baseConfig.readPolicy,
    policy:         'MRU',
  };
  const mruEngine = new CacheEngine(mruConfig);
  const mruLog    = mruEngine.simulate(sequence);
  const mruStats  = mruEngine.getStats();
  const mruState  = mruEngine.getCacheState();

  return {
    lru: { policy: 'LRU', stats: lruStats, log: lruLog, finalState: lruState },
    mru: { policy: 'MRU', stats: mruStats, log: mruLog, finalState: mruState },
  };
}


/**
 * // TODO: implement this
 * Build a comparison table as an array of row objects.
 * ui.js loops over this array to render the HTML table.
 *
 * ── ROW CONTRACT ─────────────────────────────────────────────────────
 * Each row object must have:
 * {
 *   metric:  string,          // row label, e.g. 'Cache Hits'
 *   lru:     string | number, // LRU value to display
 *   mru:     string | number, // MRU value to display
 *   winner:  string,          // 'LRU', 'MRU', or 'tie'
 * }
 *
 * Required rows (in this order):
 *   1. Total Accesses   — always a tie
 *   2. Cache Hits       — higher is better
 *   3. Cache Misses     — lower is better
 *   4. Hit Rate         — higher is better
 *   5. Miss Rate        — lower is better
 *   6. AMAT             — lower is better
 *   7. Total Access Time — lower is better
 *
 * Hint: compare the Raw values (hitRateRaw, missRateRaw, amatRaw,
 * totalTimeRaw) from getStats() to determine the winner, because
 * the formatted strings include units like "%" and "ns".
 *
 * @param {{ lru: Object, mru: Object }} comparison
 * @returns {Object[]} array of row objects
 */
function buildComparisonTable(comparison) {
  // TODO: implement this
  const lru = comparison.lru.stats;
  const mru = comparison.mru.stats;
  const rows = [];

  // 1. Total Accesses — always a tie
  rows.push({
    metric: 'Total Accesses',
    lru:    lru.totalAccesses,
    mru:    mru.totalAccesses,
    winner: 'tie',
  });

  // 2. Cache Hits — higher is better
  let hitsWinner;
  if (lru.hits === mru.hits) {
    hitsWinner = 'tie';
  } else if (lru.hits > mru.hits) {
    hitsWinner = 'LRU';
  } else {
    hitsWinner = 'MRU';
  }
  rows.push({ metric: 'Cache Hits', lru: lru.hits, mru: mru.hits, winner: hitsWinner });

  // 3. Cache Misses — lower is better
  let missesWinner;
  if (lru.misses === mru.misses) {
    missesWinner = 'tie';
  } else if (lru.misses < mru.misses) {
    missesWinner = 'LRU';
  } else {
    missesWinner = 'MRU';
  }
  rows.push({ metric: 'Cache Misses', lru: lru.misses, mru: mru.misses, winner: missesWinner });

  // 4. Hit Rate — higher is better
  let hitRateWinner;
  if (lru.hitRateRaw === mru.hitRateRaw) {
    hitRateWinner = 'tie';
  } else if (lru.hitRateRaw > mru.hitRateRaw) {
    hitRateWinner = 'LRU';
  } else {
    hitRateWinner = 'MRU';
  }
  rows.push({ metric: 'Hit Rate', lru: lru.hitRate, mru: mru.hitRate, winner: hitRateWinner });

  // 5. Miss Rate — lower is better
  let missRateWinner;
  if (lru.missRateRaw === mru.missRateRaw) {
    missRateWinner = 'tie';
  } else if (lru.missRateRaw < mru.missRateRaw) {
    missRateWinner = 'LRU';
  } else {
    missRateWinner = 'MRU';
  }
  rows.push({ metric: 'Miss Rate', lru: lru.missRate, mru: mru.missRate, winner: missRateWinner });

  // 6. AMAT — lower is better
  let amatWinner;
  if (lru.amatRaw === mru.amatRaw) {
    amatWinner = 'tie';
  } else if (lru.amatRaw < mru.amatRaw) {
    amatWinner = 'LRU';
  } else {
    amatWinner = 'MRU';
  }
  rows.push({ metric: 'AMAT', lru: lru.amat, mru: mru.amat, winner: amatWinner });

  // 7. Total Access Time — lower is better
  let timeWinner;
  if (lru.totalTimeRaw === mru.totalTimeRaw) {
    timeWinner = 'tie';
  } else if (lru.totalTimeRaw < mru.totalTimeRaw) {
    timeWinner = 'LRU';
  } else {
    timeWinner = 'MRU';
  }
  rows.push({ metric: 'Total Access Time', lru: lru.totalTime, mru: mru.totalTime, winner: timeWinner });

  return rows;
}