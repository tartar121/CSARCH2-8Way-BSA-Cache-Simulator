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

## Architectural Analysis & Test Case Results
*(To be completed after testing)*
### Test Case A: Sequential Sequence
### Test Case B: Mid-Repeat Blocks
### Test Case C: Random Sequence (64 Block Accesses)
