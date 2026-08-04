/**
 * sequences.js
 * Generates the three required test sequences for the cache simulator,
 * and handles parsing of custom user-entered sequences.
 *
 * All functions here are pure - they take simple inputs and return
 * arrays of block addresses. No DOM access, no side effects.
 *
 * The three required test cases (per project specification):
 *  - Sequential: access blocks 0 to 2n-1, repeated twice
 *  - Mid-Repeat: structured pattern with forward, repeated, and reverse passes
 *  - Random: 64 randomly generated block addresses in [0, 1023]
 */

/**
 * Generates the Sequential test sequence.
 * Accesses blocks 0 through 2n-1, then repeats the same range once more.
 * Total accesses = 4n.
 * 
 * Example (n=4): 0,1,2,3,4,5,6,7, 0,1,2,3,4,5,6,7
 *
 * @param {number} n - total number of cache blocks
 * @returns {number[]}
 */
function generateSequential(n) {
  const range = [];
  for (let i = 0; i < 2 * n; i++) range.push(i);
  return range.concat(range); // repeat the whole 0..2n-1 range once more
}


/**
 * Generates the Mid-Repeat test sequence per the project specification.
 *
 * Structure (n = total cache blocks):
 *   Part 1: 0 to n-1    (forward, once)
 *   Part 2: 0 to 2n-1   (forward, twice)
 *   Part 3: n-1 to 0    (reverse, once)
 *   Part 4: 2n-1 to 0   (reverse, twice)
 *
 * Example (n=4):
 *   0,1,2,3,
 *   0,1,2,3,4,5,6,7,  0,1,2,3,4,5,6,7,
 *   3,2,1,0,
 *   7,6,5,4,3,2,1,0,  7,6,5,4,3,2,1,0
 *
 * @param {number} n - total number of cache blocks
 * @returns {number[]}
 */
function generateMidRepeat(n) {
  const part1 = [];
  for (let i = 0; i < n; i++) part1.push(i);

  const part2 = [];
  for (let i = 0; i < 2 * n; i++) part2.push(i);

  const part3 = [...part1].reverse(); // n-1 .. 0

  const part4 = [];
  for (let i = 2 * n - 1; i >= 0; i--) part4.push(i); // 2n-1 .. 0

  return [
    ...part1,
    ...part2, ...part2,
    ...part3,
    ...part4, ...part4,
  ];
}


/**
 * Generates a random test sequence of exactly 64 block addresses.
 * All values are integers randomly chosen from [0, 1023].
 *
 * @returns {number[]}
 */
function generateRandom() {
  const seq = [];
  for (let i = 0; i < 64; i++) {
    seq.push(Math.floor(Math.random() * 1024)); // 0..1023 inclusive
  }
  return seq;
}

/**
 * Parses a raw string from the custom sequence textarea into a
 * validated array of block addresses.
 *
 * Accepts comma-separated or space-separated integers.
 * Silently filters out anything that is not an integer in [0, 1023].
 *
 * Example:
 *   "0, 5, abc, 1024, -1, 512"  →  [0, 5, 512]
 *
 * @param {string} raw - raw text from the textarea
 * @returns {number[]} cleaned array of valid block addresses
 */
function parseCustomSequence(raw) {
  if (!raw || typeof raw !== 'string') return [];

  const tokens = raw.split(/[\s,]+/).filter(t => t.length > 0);
  const result = [];

  for (const token of tokens) {
    const num = Number(token);
    if (
      !Number.isNaN(num) &&
      Number.isInteger(num) &&
      num >= 0 &&
      num <= 1023
    ) {
      result.push(num);
    }
  }

  return result;
}