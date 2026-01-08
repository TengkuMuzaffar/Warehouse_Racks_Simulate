# Hybrid I-DBLF Algorithm Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                    START PACKING ALGORITHM                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  INITIALIZATION                                                  │
│  • Set open points = [{0,0,0}]                                  │
│  • Calculate shelf spacing & divisions                          │
│  • Flatten packages array                                       │
│  • Compute stacking capacity per item                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  FOR EACH SHELF LAYER (layerIndex = 0 to shelves-1)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────────────┐
    │  RESET LAYER STATE                                    │
    │  • openPoints = [{0,0,0}]                            │
    │  • failedPoints = {}                                 │
    │  • layerBaseY = layerIndex × perDivision             │
    └───────────────────┬───────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────────────────────┐
    │  WHILE packages remain:                               │
    │    ┌──────────────────────────────────────────────┐  │
    │    │  FOR EACH package in queue:                  │  │
    │    │    FOR EACH open point:                      │  │
    │    │      Skip if point in failedPoints[pack.id]  │  │
    │    │      ┌─────────────────────────────────────┐ │  │
    │    │      │  FOR EACH rotation of pack:         │ │  │
    │    │      │    • Check: fits in bounds?         │ │  │
    │    │      │    • Check: no collision?           │ │  │
    │    │      │    • Check: sufficient support?     │ │  │
    │    │      │    ┌──────────────────────────────┐ │ │  │
    │    │      │    │  CALCULATE I-DBLF SCORE:     │ │ │  │
    │    │      │    │  ┌────────────────────────┐  │ │ │  │
    │    │      │    │  │ Depth Score (30%)     │  │ │ │  │
    │    │      │    │  │ = (z / max_z)         │  │ │ │  │
    │    │      │    │  └────────────────────────┘  │ │ │  │
    │    │      │    │  ┌────────────────────────┐  │ │ │  │
    │    │      │    │  │ Height Score (25%)    │  │ │ │  │
    │    │      │    │  │ = 1 - (y / max_y)     │  │ │ │  │
    │    │      │    │  └────────────────────────┘  │ │ │  │
    │    │      │    │  ┌────────────────────────┐  │ │ │  │
    │    │      │    │  │ Left Score (20%)      │  │ │ │  │
    │    │      │    │  │ = 1 - (x / max_x)     │  │ │ │  │
    │    │      │    │  └────────────────────────┘  │ │ │  │
    │    │      │    │  ┌────────────────────────┐  │ │ │  │
    │    │      │    │  │ Compactness (15%)     │  │ │ │  │
    │    │      │    │  │ = adjacent_sides / 4  │  │ │ │  │
    │    │      │    │  └────────────────────────┘  │ │ │  │
    │    │      │    │  ┌────────────────────────┐  │ │ │  │
    │    │      │    │  │ Support (10%)         │  │ │ │  │
    │    │      │    │  │ = overlap_area / base │  │ │ │  │
    │    │      │    │  └────────────────────────┘  │ │ │  │
    │    │      │    └──────────────────────────────┘ │ │  │
    │    │      │    • Combine with base area score  │ │  │
    │    │      │    • hybridScore = DBLF×0.3 +      │ │  │
    │    │      │                    area×0.7         │ │  │
    │    │      │    ┌──────────────────────────────┐ │ │  │
    │    │      │    │  IF score > bestScore:       │ │ │  │
    │    │      │    │    bestPlacement = current   │ │ │  │
    │    │      │    │    bestScore = score         │ │ │  │
    │    │      │    └──────────────────────────────┘ │ │  │
    │    │      └─────────────────────────────────────┘ │  │
    │    │      IF no rotation fits:                    │  │
    │    │        Mark point as failed for this pack    │  │
    │    └──────────────────────────────────────────────┘  │
    │                                                       │
    │    ┌──────────────────────────────────────────────┐  │
    │    │  IF bestPlacement found:                     │  │
    │    │    • Create pack at bestPlacement            │  │
    │    │    • Track shelf utilization                 │  │
    │    │    • Generate new extreme points             │  │
    │    │    • Remove point from openPoints            │  │
    │    │    • Remove pack from queue                  │  │
    │    │    • Sort openPoints (ground-level first)    │  │
    │    │    • Log: ✓ Placed [scores]                 │  │
    │    │    • BREAK (try next pack)                   │  │
    │    │  ELSE:                                        │  │
    │    │    • Mark all points failed for this pack    │  │
    │    └──────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────────────────────┐
    │  Log shelf statistics:                                │
    │  • Packs placed this layer                           │
    │  • Packages remaining                                │
    │  • Volume used in this shelf                         │
    └───────────────────┬───────────────────────────────────┘
                        │
                        ▼
    ┌───────────────────────────────────────────────────────┐
    │  Continue to next shelf layer                         │
    └───────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  IF packages remain after all shelves:                          │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │  FALLBACK PASS (full container height)                  │  │
│    │  • layerBaseY = 0                                       │  │
│    │  • Regenerate openPoints from placed items             │  │
│    │  • Try placing remaining items without shelf limits    │  │
│    └─────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  CALCULATE FINAL STATISTICS                                      │
│  • Total items packed                                           │
│  • Container volume utilization (%)                             │
│  • Per-shelf volume distribution                                │
│  • Average placement scores                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  LOG RESULTS                                                     │
│  === Hybrid I-DBLF Packing Complete ===                         │
│  Packed Items: X                                                │
│  Volume Utilization: XX.XX%                                     │
│  Shelf Utilization: {...}                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                        [ END ]
```

## Score Calculation Detail

```
┌───────────────────────────────────────────────────────────┐
│  PLACEMENT SCORE BREAKDOWN                                │
│                                                           │
│  Input: pack, point(x,y,z), container, orientation       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 1. DEPTH COMPONENT (Weight: 30)                     │ │
│  │    depthRatio = point.z / (container.l - pack.l)    │ │
│  │    depthScore = 30 × depthRatio                      │ │
│  │    → Favor back positions (larger Z)                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 2. HEIGHT COMPONENT (Weight: 25)                    │ │
│  │    heightRatio = 1 - (point.y / container.h)        │ │
│  │    heightScore = 25 × heightRatio                    │ │
│  │    → Favor lower positions (smaller Y)              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 3. LEFT COMPONENT (Weight: 20)                      │ │
│  │    leftRatio = 1 - (point.x / (container.w - pack.w))│ │
│  │    leftScore = 20 × leftRatio                        │ │
│  │    → Favor left positions (smaller X)               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 4. COMPACTNESS COMPONENT (Weight: 15)               │ │
│  │    adjacentCount = count items touching on X or Z   │ │
│  │    compactness = min(adjacentCount / 4, 1)          │ │
│  │    compactScore = 15 × compactness                   │ │
│  │    → Favor filling gaps                             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 5. SUPPORT COMPONENT (Weight: 10)                   │ │
│  │    supportArea = overlap with items below           │ │
│  │    supportRatio = supportArea / baseArea            │ │
│  │    supportScore = 10 × supportRatio                  │ │
│  │    → Ensure stability (≥75% required)               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  TOTAL I-DBLF SCORE = sum of all components (0-100)     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ HYBRID BLEND                                         │ │
│  │    baseArea = pack.w × pack.l                        │ │
│  │    hybridScore = (idblfScore × 0.3) +                │ │
│  │                  (baseArea × 0.7)                    │ │
│  │    → Balance strategy with volume efficiency        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Output: hybridScore (higher = better placement)         │
└───────────────────────────────────────────────────────────┘
```

## Key Decision Points

```
Is orientation valid?
├─ NO → Try next rotation
└─ YES
   │
   ▼
   Does it fit in container?
   ├─ NO → Try next rotation
   └─ YES
      │
      ▼
      Any collisions?
      ├─ YES → Try next rotation
      └─ NO
         │
         ▼
         Sufficient support (≥75%)?
         ├─ NO (and y > 0) → Try next rotation
         └─ YES
            │
            ▼
            Calculate scores
            │
            ▼
            Better than current best?
            ├─ NO → Try next rotation
            └─ YES → Update best placement
```

## Data Structures

```
OpenPoint {
    x: number,          // X coordinate
    y: number,          // Y coordinate (relative to layer)
    z: number,          // Z coordinate
    type: "T"|"S"|...,  // Point type
    pointOwner: id      // Pack that created this point
}

PlacementCandidate {
    point: OpenPoint,           // Where to place
    orientationIndex: number,   // Which rotation
    score: number,              // Hybrid score
    idblfScore: number,         // Strategic score
    packIndex: number           // Which package
}

ShelfUtilization: Map<layerIndex, volumeUsed>
FailedPoints: Map<packId, Set<pointKey>>
```

## Performance Characteristics

```
Best Case:    O(n × p × r)  where n=items, p=points, r=rotations
Average Case: O(n × p × r)
Worst Case:   O(n² × p × r) with many failed attempts

Space: O(n + p) for loaded items and open points

Optimization:
• Failed-point caching prevents O(n²) behavior
• Early termination on first valid rotation per point
• Ground-level point prioritization improves first-pass success
```
