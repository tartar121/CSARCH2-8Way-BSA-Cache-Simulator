/**
 * comparison.js
 * Runs the same block access sequence through both LRU and MRU policies
 * and returns a structured comparison of their results.
 *
 * All functions here are pure - no DOM access, no side effects.
 * ui.js calls runComparison() to get the data and then renders it.
 *
 * How it works:
 *  1. Creates two separate CacheEngine instances (one LRU, one MRU)
 *  2. Runs the same sequence through both
 *  3. Collects stats, logs, and final cache state from each
 *  4. Builds a comparison table showing which policy performed better
 *     for each metric (hits, misses, hit rate, miss rate, AMAT, total time)
 */

/**
 * 
 * Runs the given sequence through both LRU and MRU policies independently
 * using separate CacheEngine instances, then returns both results.
 *
 * Both engines use the same baseConfig (cache blocks, block size, read policy)
 * and the same sequence, so the only variable is the replacement policy.
 *
 * @param {number[]} sequence   - block access sequence to test
 * @param {Object}   baseConfig - { numCacheBlocks, blockSize, readPolicy }
 * @returns {{ lru: Object, mru: Object }}
 */
function runComparison(sequence, baseConfig) {
  
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
 * Builds a comparison table from the results of runComparison().
 * Returns an array of row objects that ui.js uses to render the table.
 *
 * Each row compares one metric between LRU and MRU and identifies
 * which policy performed better (or marks it as a tie).
 *
 * Metrics included (in order):
 *   Total Accesses, Cache Hits, Cache Misses,
 *   Hit Rate, Miss Rate, AMAT, Total Memory Access Time
 *
 * @param {{ lru: Object, mru: Object }} comparison - output of runComparison()
 * @returns {Object[]} array of { metric, lru, mru, winner } row objects
 */
function buildComparisonTable(comparison) {
  
  const lru = comparison.lru.stats;
  const mru = comparison.mru.stats;
  const rows = [];

  // 1. Total Accesses - always a tie
  rows.push({
    metric: 'Total Accesses',
    lru:    lru.totalAccesses,
    mru:    mru.totalAccesses,
    winner: 'tie',
  });

  // 2. Cache Hits - higher is better
  let hitsWinner;
  if (lru.hits === mru.hits) {
    hitsWinner = 'tie';
  } else if (lru.hits > mru.hits) {
    hitsWinner = 'LRU';
  } else {
    hitsWinner = 'MRU';
  }
  rows.push({ metric: 'Cache Hits', lru: lru.hits, mru: mru.hits, winner: hitsWinner });

  // 3. Cache Misses - lower is better
  let missesWinner;
  if (lru.misses === mru.misses) {
    missesWinner = 'tie';
  } else if (lru.misses < mru.misses) {
    missesWinner = 'LRU';
  } else {
    missesWinner = 'MRU';
  }
  rows.push({ metric: 'Cache Misses', lru: lru.misses, mru: mru.misses, winner: missesWinner });

  // 4. Hit Rate - higher is better
  let hitRateWinner;
  if (lru.hitRateRaw === mru.hitRateRaw) {
    hitRateWinner = 'tie';
  } else if (lru.hitRateRaw > mru.hitRateRaw) {
    hitRateWinner = 'LRU';
  } else {
    hitRateWinner = 'MRU';
  }
  rows.push({ metric: 'Hit Rate', lru: lru.hitRate, mru: mru.hitRate, winner: hitRateWinner });

  // 5. Miss Rate - lower is better
  let missRateWinner;
  if (lru.missRateRaw === mru.missRateRaw) {
    missRateWinner = 'tie';
  } else if (lru.missRateRaw < mru.missRateRaw) {
    missRateWinner = 'LRU';
  } else {
    missRateWinner = 'MRU';
  }
  rows.push({ metric: 'Miss Rate', lru: lru.missRate, mru: mru.missRate, winner: missRateWinner });

  // 6. AMAT - lower is better
  let amatWinner;
  if (lru.amatRaw === mru.amatRaw) {
    amatWinner = 'tie';
  } else if (lru.amatRaw < mru.amatRaw) {
    amatWinner = 'LRU';
  } else {
    amatWinner = 'MRU';
  }
  rows.push({ metric: 'AMAT', lru: lru.amat, mru: mru.amat, winner: amatWinner });

  // 7. Total Memory Access Time - lower is better
  let timeWinner;
  if (lru.totalTimeRaw === mru.totalTimeRaw) {
    timeWinner = 'tie';
  } else if (lru.totalTimeRaw < mru.totalTimeRaw) {
    timeWinner = 'LRU';
  } else {
    timeWinner = 'MRU';
  }
  rows.push({ metric: 'Total Memory Access Time', lru: lru.totalTime, mru: mru.totalTime, winner: timeWinner });

  return rows;
}