/**
 * cache-engine.js
 * Core cache simulation logic for an 8-Way Set Associative cache (Machine 9).
 *
 * This file is pure logic - it has no access to the DOM and does not
 * interact with the UI in any way. All methods return plain data objects
 * that ui.js reads and renders.
 *
 * Cache organization:
 *  - 8 ways per set (fixed for Machine 9)
 *  - Number of sets = Total cache blocks / 8
 *  - Address mapping:
 *      Set Index = Block Number mod Number of Sets
 *      Tag = floor(Block Number / Number of Sets)
 *
 * Supports two replacement policies:
 *  - LRU (Least Recently Used): evicts the line accessed longest ago
 *  - MRU (Most Recently Used): evicts the line accessed most recently
 *
 * Supports two read policies:
 *  - Non-load-through: AMAT = Tc + (Miss Rate × Tm)
 *  - Load-through: AMAT = (Hit Rate × Tc) + (Miss Rate × Tm)
 */

// Constants
const MAIN_MEMORY_BLOCKS = 1024;  // fixed per project spec
const WAYS               = 8;     // fixed for Machine 9 (8-way)
const CACHE_ACCESS_TIME  = 1;     // ns (Tc - Cache Access Time)
const MEMORY_ACCESS_TIME = 10;    // ns (Tm - Main Memory Access Time)

// CacheEngine Class
class CacheEngine {
  /**
    * Creates a new CacheEngine instance with the given configuration.
    * Initializes the cache sets and resets all statistics.
    *
    * @param {Object} config
    * @param {number} config.numCacheBlocks - total number of cache blocks (power of 2, minimum 8)
    * @param {number} config.blockSize      - number of words per block (power of 2, minimum 2)
    * @param {string} config.policy         - replacement policy: 'LRU' or 'MRU'
    * @param {string} config.readPolicy     - read policy: 'non-load-through' or 'load-through'
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
   * Initializes all cache sets to an empty state.
   * Each set contains 8 ways, and each way starts as invalid (valid: false).
   * Also initializes a per-set clock used to track access order for LRU/MRU.
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
   * Resets all hit/miss counters and clears the access log.
   * Called automatically at the start of every simulate() call.
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
   * Decomposes a block address into its set index and tag.
   *
   * Formula (per project specification):
   *   setIndex = blockAddr % numSets
   *   tag      = floor(blockAddr / numSets)
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
   * Selects which way to evict from a full set based on the active policy.
   *
   * LRU: evicts the way with the smallest order value (accessed longest ago)
   * MRU: evicts the way with the largest order value (accessed most recently)
   *
   * @param {Object[]} set - array of 8 cache line objects for one set
   * @returns {number} index (0–7) of the way to evict
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
   * Processes a single block access against the cache.
   *
   * On a HIT: updates the accessed line's order timestamp.
   * On a MISS: loads the block into an empty slot if one exists,
   *            or evicts a victim (via LRU/MRU) if the set is full.
   *
   * @param {number} blockAddr
   * @returns {Object} log entry
   */
  access(blockAddr) {
    // Increment overall counter & local set clock
    this.stats.totalAccesses++;
    const { setIndex, tag } = this.decompose(blockAddr);
    this.setClock[setIndex]++;
    const currentClock = this.setClock[setIndex];

    const targetSet = this.sets[setIndex];
    let result = 'MISS';
    let hitLine = null;
    let loadedLine = null;
    let evicted = null;

    // Check for cache hit across all 8 ways in the set
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

    // Create a deep snapshot copy of the 8 lines in this set for rendering in UI
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

    // Save to access log and return
    this.accessLog.push(logEntry);
    return logEntry;
  }

  // Batch Simulation
  /**
   * Runs a full simulation from scratch on the given sequence of block addresses.
   * Resets the cache and statistics before starting.
   *
   * @param {number[]} sequence - array of block addresses to access in order
   * @returns {Object[]} array of log entries, one per access
   */
  simulate(sequence) {
    this._initCache();
    this._resetStats();
    return sequence.map(addr => this.access(addr));
  }

  // Statistics
  /**
   * Computes and returns all statistics for the current simulation state.
   * Can be called mid-simulation (e.g. during step-by-step mode) or after
   * the full sequence has been processed.
   *
   * AMAT formulas:
   *   Non-load-through: AMAT = Tc + (Miss Rate × Tm)
   *   Load-through:     AMAT = (Hit Rate × Tc) + (Miss Rate × Tm)
   *
   * Where Tc = 1 ns (cache access time) and Tm = 10 ns (memory access time)
   * 
   * @returns {Object} statistics object (see STATS CONTRACT in code)
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

    // Total Memory Access Time = Total Accesses × AMAT
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
   * Returns a snapshot of the entire cache state at the current moment.
   * Returns a deep copy so the caller cannot accidentally mutate live cache data.
   *
   * @returns {Object[][]} 2D array [numSets][8] of cache line objects
   */
  getCacheState() {
    // Return a cloned copy of the 2D array to prevent external direct mutations
    return this.sets.map(set => set.map(line => ({ ...line })));
  }
}