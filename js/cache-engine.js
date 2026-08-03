/**
 * cache-engine.js
 * Core cache simulation logic.
 *     NO DOM access in this file — no document.getElementById, no alert.
 *     This file is pure logic only.
 *     Member 2 (ui.js) calls the methods here and handles all display.
 *
 * YOUR JOB:
 *   1. Fill in the CacheEngine class methods marked with TODO.
 *   2. Make sure getStats() returns an object with EXACTLY the fields
 *      listed in the DATA CONTRACT below — Member 2 depends on them.
 *   3. Make sure access() returns a log entry with EXACTLY the fields
 *      listed in the LOG ENTRY CONTRACT below.
 *   4. Test your logic in the browser console before the UI is ready:
 *        const e = new CacheEngine({numCacheBlocks:16, blockSize:4, policy:'LRU', readPolicy:'non-load-through'});
 *        e.simulate([0,1,0]);
 *        console.log(e.getStats());
 */

// Constants
const MAIN_MEMORY_BLOCKS = 1024;  // fixed per project spec[cite: 1]
const WAYS               = 8;     // fixed for Machine 9 (8-way)[cite: 1]
const CACHE_ACCESS_TIME  = 1;     // ns (Tc - Cache Access Time)
const MEMORY_ACCESS_TIME = 10;    // ns (Tm - Main Memory Access Time)


// CacheEngine Class
class CacheEngine {
  /**
   * @param {Object} config
   * @param {number} config.numCacheBlocks  - total cache blocks (power of 2, ≥ 8)
   * @param {number} config.blockSize       - words per block (power of 2, ≥ 2)
   * @param {string} config.policy          - 'LRU' or 'MRU'
   * @param {string} config.readPolicy      - 'non-load-through' or 'load-through'
   */
  constructor(config) {
    this.numCacheBlocks = config.numCacheBlocks;
    this.blockSize      = config.blockSize;
    this.policy         = config.policy;
    this.readPolicy     = config.readPolicy;
    this.ways           = WAYS;
    // Calculate total sets for Set-Associative Mapping: NumSets = TotalBlocks / Ways
    this.numSets        = Math.floor(this.numCacheBlocks / this.ways);

    if (this.numSets < 1) {
      throw new Error(`Need at least ${WAYS} cache blocks for 8-way set associative.`);
    }

    this._initCache();
    this._resetStats();
  }

  // Private: Initialisation
  /**
   * TODO: implement this
   * Initialise this.sets as a 2D array: [numSets][ways]
   * Each cache line should be an object with:
   *   { valid: false, tag: null, blockNum: null, order: 0 }
   *
   * Also initialise this.setClock as an array of numSets zeros.
   * The clock for each set is incremented on every access to that set,
   * and is used as the 'order' timestamp for LRU/MRU tracking.
   */
  _initCache() {
    // Allocate 2D array: numSets rows x 8 ways (columns)
    // Every cache slot starts empty (valid = false)
    this.sets = Array.from({ length: this.numSets }, () =>
      Array.from({ length: this.ways }, () => ({
        valid: false,
        tag: null,
        blockNum: null,
        order: 0
      }))
    );
    
    // Independent step counter per set to track relative access order for LRU/MRU
    this.setClock = new Array(this.numSets).fill(0);
  }

  /**
   * TODO: implement this
   * Reset hit/miss counters and the access log array.
   */
  _resetStats() {
    this.stats = {
      totalAccesses: 0,
      hits:          0,
      misses:        0,
    };
    this.accessLog = [];
  }

  // Address Decomposition
  /**
   * TODO:
   * Given a block address, return its set index and tag.
   *
   * Formula:
   *   setIndex = blockAddr % numSets
   *   tag      = Math.floor(blockAddr / numSets)
   *
   * @param {number} blockAddr
   * @returns {{ setIndex: number, tag: number }}
   */
  decompose(blockAddr) {
    const setIndex = blockAddr % this.numSets;
    const tag = Math.floor(blockAddr / this.numSets);
    return { setIndex, tag };
  }

  // Replacement Policy 
  /**
   * TODO: implement this
   * Select which way index to evict from a full set.
   *
   * LRU: evict the line with the SMALLEST order value (accessed longest ago)
   * MRU: evict the line with the LARGEST  order value (accessed most recently)
   *
   * @param {Object[]} set - array of cache lines for one set
   * @returns {number} index of the line to evict (0–7)
   */
  _selectVictim(set) {
    let victimIndex = 0;
    let targetOrder = set[0].order;

    for (let way = 1; way < set.length; way++) {
      if (this.policy === 'LRU') {
        // Find line with lowest order (least recently used)
        if (set[way].order < targetOrder) {
          targetOrder = set[way].order;
          victimIndex = way;
        }
      } else if (this.policy === 'MRU') {
        // Find line with highest order (most recently used)
        if (set[way].order > targetOrder) {
          targetOrder = set[way].order;
          victimIndex = way;
        }
      }
    }
    return victimIndex;
  }

  // Core Access
  /**
   * TODO: implement this
   * Process one block access. This is the most important method.
   *
   * Steps:
   *   1. Increment totalAccesses and the set's clock.
   *   2. Decompose blockAddr into setIndex and tag.
   *   3. Search the set for a line with matching tag and valid=true.
   *      - If found: HIT — update that line's order to current clock.
   *      - If not found: MISS
   *          a. Find an empty slot (valid=false) -> load into it.
   *          b. No empty slot -> call _selectVictim(), record eviction, replace.
   *   4. Build and return a log entry object (see LOG ENTRY CONTRACT below).
   *   5. Push the log entry to this.accessLog.
   *
   * LOG ENTRY CONTRACT
   * Return an object with EXACTLY these fields (Member 2 reads all of them):
   * {
   *   accessNum:   number,   // 1-indexed access counter
   *   blockAddr:   number,   // the block address that was accessed
   *   setIndex:    number,   // which set it maps to
   *   tag:         number,   // the tag value
   *   result:      string,   // 'HIT' or 'MISS'
   *   policy:      string,   // 'LRU' or 'MRU'
   *   readPolicy:  string,   // 'non-load-through' or 'load-through'
   *   hitLine:     number|null,  // way index of the hit (null if MISS)
   *   loadedLine:  number|null,  // way index where block was loaded (null if HIT)
   *   evicted: null | {          // null if no eviction occurred
   *     line:     number,    // way index that was evicted
   *     blockNum: number,    // block number that was evicted
   *     tag:      number,    // tag of evicted block
   *     reason:   string,    // human-readable reason, e.g. "Least recently used (order 3)"
   *   },
   *   snapshot: Object[],   // deep copy of the set's lines AFTER this access
   *                         // (array of 8 line objects for this set)
   * }
   *
   * @param {number} blockAddr
   * @returns {Object} log entry
   */
  access(blockAddr) {
    // Step 1: Increment overall counter & local set clock
    this.stats.totalAccesses++;
    const { setIndex, tag } = this.decompose(blockAddr);
    this.setClock[setIndex]++;
    const currentClock = this.setClock[setIndex];

    const targetSet = this.sets[setIndex];
    let result = 'MISS';
    let hitLine = null;
    let loadedLine = null;
    let evicted = null;

    // Step 2 & 3: Check for cache hit across all 8 ways in the set
    for (let way = 0; way < this.ways; way++) {
      if (targetSet[way].valid && targetSet[way].tag === tag) {
        result = 'HIT';
        hitLine = way;
        break;
      }
    }

    if (result === 'HIT') {
      // HIT: Update access order timestamp to current set clock
      this.stats.hits++;
      targetSet[hitLine].order = currentClock;
    } else {
      // MISS: Search for available empty way
      this.stats.misses++;
      const emptySlotIndex = targetSet.findIndex(line => !line.valid);

      if (emptySlotIndex !== -1) {
        // Load into empty slot
        loadedLine = emptySlotIndex;
      } else {
        // Set is full: Select victim via LRU or MRU policy and evict
        loadedLine = this._selectVictim(targetSet);
        const victimLine = targetSet[loadedLine];

        const reasonText = this.policy === 'LRU'
          ? `Least recently used (order ${victimLine.order})`
          : `Most recently used (order ${victimLine.order})`;

        evicted = {
          line: loadedLine,
          blockNum: victimLine.blockNum,
          tag: victimLine.tag,
          reason: reasonText
        };
      }

      // Update line in target set
      targetSet[loadedLine] = {
        valid: true,
        tag: tag,
        blockNum: blockAddr,
        order: currentClock
      };
    }

    // Step 4: Create a deep snapshot copy of the 8 lines in this set for rendering in UI
    const snapshot = targetSet.map(line => ({ ...line }));

    // Construct log entry adhering to LOG ENTRY CONTRACT
    const logEntry = {
      accessNum:  this.stats.totalAccesses,
      blockAddr:  blockAddr,
      setIndex:   setIndex,
      tag:        tag,
      result:     result,
      policy:     this.policy,
      readPolicy: this.readPolicy,
      hitLine:    hitLine,
      loadedLine: loadedLine,
      evicted:    evicted,
      snapshot:   snapshot
    };

    // Step 5: Save to access log and return
    this.accessLog.push(logEntry);
    return logEntry;
  }

  // Batch Simulation
  /**
   * Run a complete sequence of block accesses from scratch.
   * Resets the cache and stats before starting.
   *
   * @param {number[]} sequence
   * @returns {Object[]} array of log entries (one per access)
   */
  simulate(sequence) {
    this._initCache();
    this._resetStats();
    return sequence.map(addr => this.access(addr));
  }

  // Statistics
  /**
   * TODO:
   * Compute and return all statistics after a simulation (or partial run).
   *
   * STATS CONTRACT
   * Return an object with EXACTLY these fields (Member 2 reads all of them):
   * {
   *   totalAccesses: number,
   *   hits:          number,
   *   misses:        number,
   *   hitRate:       string,   // e.g. "75.00%"
   *   missRate:      string,   // e.g. "25.00%"
   *   hitRateRaw:    number,   // e.g. 0.75  (used by comparison.js)
   *   missRateRaw:   number,   // e.g. 0.25
   *   amat:          string,   // e.g. "3.5000 ns"
   *   amatRaw:       number,   // e.g. 3.5    (used by comparison.js)
   *   totalTime:     string,   // e.g. "224.00 ns"
   *   totalTimeRaw:  number,   // e.g. 224    (used by comparison.js)
   * }
   *
   * AMAT formulas:
   *   non-load-through: AMAT = Tc + (missRate × Tm)
   *                          = 1  + (missRate × 10)
   *   load-through:     AMAT = (hitRate × Tc) + (missRate × Tm)
   *                          = (hitRate × 1)  + (missRate × 10)
   *
   * @returns {Object}
   */
  getStats() {
    const total = this.stats.totalAccesses;
    const hits = this.stats.hits;
    const misses = this.stats.misses;

    const hitRateRaw  = total > 0 ? hits / total : 0;
    const missRateRaw = total > 0 ? misses / total : 0;

    // AMAT Formula Calculation
    let amatRaw = 0;
    if (this.readPolicy === 'load-through') {
      // load-through: AMAT = (hitRate × Tc) + (missRate × Tm)
      amatRaw = (hitRateRaw * CACHE_ACCESS_TIME) + (missRateRaw * MEMORY_ACCESS_TIME);
    } else {
      // non-load-through: AMAT = Tc + (missRate × Tm)
      amatRaw = CACHE_ACCESS_TIME + (missRateRaw * MEMORY_ACCESS_TIME);
    }

    // Total Access Time = Total Accesses × AMAT
    const totalTimeRaw = total * amatRaw;

    return {
      totalAccesses: total,
      hits:          hits,
      misses:        misses,
      hitRate:       `${(hitRateRaw * 100).toFixed(2)}%`,
      missRate:      `${(missRateRaw * 100).toFixed(2)}%`,
      hitRateRaw:    hitRateRaw,
      missRateRaw:   missRateRaw,
      amat:          `${amatRaw.toFixed(4)} ns`,
      amatRaw:       amatRaw,
      totalTime:     `${totalTimeRaw.toFixed(2)} ns`,
      totalTimeRaw:  totalTimeRaw
    };
  }

  // Final State Snapshot

  /**
   * Return the current state of ALL cache sets.
   * Used by ui.js for the Final Snapshot display mode.
   *
   * @returns {Object[][]} 2D array [numSets][ways] of cache line objects
   */
  getCacheState() {
    // Return a cloned copy of the 2D array to prevent external direct mutations
    return this.sets.map(set => set.map(line => ({ ...line })));
  }
}