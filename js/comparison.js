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
  return { lru: null, mru: null };
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
  return [];
}