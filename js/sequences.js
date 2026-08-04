/**
 * sequences.js for Member 4
 * Generates the three required test sequences and handles custom input.
 *     No DOM access here. These are pure functions that return arrays.
 *     Member 2 (ui.js) calls these and passes the result to the engine.
 *
 * YOUR JOB:
 *   1. Fill in the three generator functions below.
 *   2. Fill in parseCustomSequence().
 *   3. Test each function in the browser console:
 *        console.log(generateSequential(16));   // should be 64 numbers
 *        console.log(generateMidRepeat(4));      // check against spec
 *        console.log(generateRandom().length);   // should be 64
 */


/**
 * // TODO: implement this
 * Generate the Sequential test sequence.
 *
 * Spec: Access blocks 0 to 2n-1, then repeat the same range once more.
 * Total accesses = 4n.
 *
 * Example (n=4):
 *   0,1,2,3,4,5,6,7,  0,1,2,3,4,5,6,7
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
 * // TODO: implement this
 * Generate the Mid-Repeat test sequence EXACTLY per the project spec.
 *
 * Spec (let n = total cache blocks):
 *   Part 1: 0 to n-1
 *   Part 2: 0 to 2n-1   (repeated twice)
 *   Part 3: n-1 to 0    (reverse)
 *   Part 4: 2n-1 to 0   (reverse, repeated twice)
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
 * // TODO: implement this
 * Generate a random sequence of exactly 64 block accesses.
 * All values must be integers in the range [0, 1023] (inclusive).
 *
 * Hint: Math.floor(Math.random() * 1024)
 *
 * @returns {number[]} array of 64 random integers
 */
function generateRandom() {
  const seq = [];
  for (let i = 0; i < 64; i++) {
    seq.push(Math.floor(Math.random() * 1024)); // 0..1023 inclusive
  }
  return seq;
}


/**
 * // TODO: implement this
 * Parse a raw string from the custom sequence textarea into a
 * clean array of valid block addresses.
 *
 * Rules:
 *   - Split on commas and/or whitespace
 *   - Convert each token to a number with Number()
 *   - Filter out anything that is:
 *       • NaN
 *       • not an integer (e.g. 1.5)
 *       • less than 0
 *       • greater than 1023
 *
 * Returns an empty array if nothing valid remains.
 *
 * Example:
 *   parseCustomSequence("0, 5, abc, 1024, -1, 512")
 *   -> [0, 5, 512]
 *
 * @param {string} raw - the raw textarea content
 * @returns {number[]}
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