# CSARCH2 Cache Memory Simulation (Machine 9)
### 3rd Term AY 2025-2026 | S05 Group 9
---

### Members
| Name | GitHub |
| :--- | :--- |
| Dabuit, Daniel Jedrick C. | [@danueli](https://github.com/danueli) |
| Go, John William D. | [@johnwilliam-go](https://github.com/johnwilliam-go) |
| Liwanag, Ram Miguel C. | [@Rammy-errorlol](https://github.com/Rammy-errorlol) |
| Lobo, Shirley Marie A. | [@SAM-lvl1](https://github.com/SAM-lvl1) |
| Uy, Tara Ysabel P. | [@tartar121](https://github.com/tartar121) |

---

## Project Overview
This web-based application simulates and compares two cache operations for an **8-Way Block Set Associative (BSA)** cache memory system:
1. **8-Way BSA + Least Recently Used (LRU)**
2. **8-Way BSA + Most Recently Used (MRU)**

The simulator provides step-by-step memory trace animation, real-time cache layout updates, detailed statistical reporting, and side-by-side performance comparisons.

---

## Live Deployment & Demo
* **Live Website:** [Insert Deployment Link Here] 
* **Video Walkthrough:** [Insert 5-8 Minute YouTube Link Here]

---

## Cache Simulation Specifications
* **Main Memory Size:** Fixed at 1024 blocks (Block numbers 0–1023)
* **Block Size:** Parameterized (Power of 2, minimum 2 words)
* **Number of Cache Blocks ($n$):** Parameterized (Power of 2, minimum 4 blocks)
* **Read Policy:** Parameterized (**Load-Through** / **Non-Load-Through**)
* **Associativity:** 8-Way Set Associative
  * $\text{Total Sets} = \frac{n}{8}$
  * $\text{Set Index} = \text{Block Number} \pmod{\text{Total Sets}}$
  * $\text{Tag} = \left\lfloor \frac{\text{Block Number}}{\text{Total Sets}} \right\rfloor$

---

## Output Metrics Computed
1. Total Memory Access Count
2. Cache Hit Count & Cache Miss Count
3. Cache Hit Rate (%) & Cache Miss Rate (%)
4. Average Memory Access Time (AMAT)
5. Total Memory Access Time (Cycles)

---

## Test Case Specifications

Let **n** = total number of cache blocks.

### Test Case A: Sequential Sequence
Access blocks `0` to `2n−1`, then repeat the full range once more.

Example (n = 4): 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7
Total accesses: 4n

### Test Case B: Mid-Repeat Blocks
1. `0` to `n−1`
2. `0` to `2n−1` × 2
3. Reverse: `n−1` to `0`
4. Reverse: `2n−1` to `0` × 2

Example (n = 4):
0, 1, 2, 3,
0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
3, 2, 1, 0,
7, 6, 5, 4, 3, 2, 1, 0, 7, 6, 5, 4, 3, 2, 1, 0

### Test Case C: Random Sequence
64 randomly generated block addresses in the range `[0, 1023]`.

---

## Architectural Analysis & Test Case Results

> **Note:** The following results were obtained using the default configuration:
> `n = 16 cache blocks | 8-way | 2 sets | Block size = 4 words | Non-Load-Through`

---

### Test Case A: Sequential Sequence

#### Parameters Used
| Parameter | Value |
| :--- | :--- |
| Number of Cache Blocks (n) | 16 |
| Block Size | 4 words |
| Number of Sets | 2 |
| Read Policy | Non-Load-Through |

#### LRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### MRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### Screenshots
| LRU Final Snapshot | MRU Final Snapshot |
| :---: | :---: |
| *(screenshot here)* | *(screenshot here)* |

#### Discussion
*(To be completed after testing. Discuss which policy performed better, why the results came out the way they did, and what the sequential access pattern reveals about LRU vs MRU behavior.)*

---

### Test Case B: Mid-Repeat Blocks

#### Parameters Used
| Parameter | Value |
| :--- | :--- |
| Number of Cache Blocks (n) | 16 |
| Block Size | 4 words |
| Number of Sets | 2 |
| Read Policy | Non-Load-Through |

#### LRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### MRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### Screenshots
| LRU Final Snapshot | MRU Final Snapshot |
| :---: | :---: |
| *(screenshot here)* | *(screenshot here)* |

#### Discussion
*(To be completed after testing. Discuss how the repeated inner loop and reversal phases affect each policy differently, and which policy handled the mid-repeat pattern better and why.)*

---

### Test Case C: Random Sequence (64 Block Accesses)

#### Parameters Used
| Parameter | Value |
| :--- | :--- |
| Number of Cache Blocks (n) | 16 |
| Block Size | 4 words |
| Number of Sets | 2 |
| Read Policy | Non-Load-Through |

#### LRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### MRU Results
| Metric | Value |
| :--- | :--- |
| Total Accesses | *(to be filled)* |
| Cache Hits | *(to be filled)* |
| Cache Misses | *(to be filled)* |
| Hit Rate | *(to be filled)* |
| Miss Rate | *(to be filled)* |
| AMAT | *(to be filled)* |
| Total Access Time | *(to be filled)* |

#### Screenshots
| LRU Final Snapshot | MRU Final Snapshot |
| :---: | :---: |
| *(screenshot here)* | *(screenshot here)* |

#### Discussion
*(To be completed after testing. Discuss whether LRU or MRU produced better results on a random sequence, and explain why random access patterns make it difficult for either policy to exploit locality.)*

---

## Overall Comparison Summary

| Metric | Sequential | Mid-Repeat | Random |
| :--- | :---: | :---: | :---: |
| Better Policy | *(to be filled)* | *(to be filled)* | *(to be filled)* |
| LRU Hit Rate | *(to be filled)* | *(to be filled)* | *(to be filled)* |
| MRU Hit Rate | *(to be filled)* | *(to be filled)* | *(to be filled)* |
| LRU AMAT | *(to be filled)* | *(to be filled)* | *(to be filled)* |
| MRU AMAT | *(to be filled)* | *(to be filled)* | *(to be filled)* |

### Overall Conclusion
*(To be completed after all three test cases are run. Summarize which policy generally performs better, under what conditions each one shines, and what your group concludes about 8-Way BSA cache behavior with LRU vs MRU.)*

---

## How to Run Locally

No build step required -> open `index.html` directly in any browser.

```bash
# Option 1: open the file directly
open index.html

# Option 2: serve locally to avoid any issues
python3 -m http.server 8080
# then visit http://localhost:8080
```

### Deploy to GitHub Pages
1. Push the repository to GitHub.
2. Go to **Settings → Pages → Source** → select `main` branch, `/ (root)`.
3. Copy the generated URL and paste it into the Live Deployment section above.

---

*CSARCH2 · S05 Group 9 · 3rd Term AY 2025–2026*
