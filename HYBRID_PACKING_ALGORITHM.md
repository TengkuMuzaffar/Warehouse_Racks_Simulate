# Hybrid I-DBLF 3D Bin Packing Algorithm

## Overview

This implementation uses a **Hybrid Improved Deepest Bottom Left with Fill (I-DBLF)** algorithm for shelf-based 3D bin packing. The approach combines heuristic packing strategies with advanced placement scoring to optimize space utilization.

## Key Features

### 1. I-DBLF Strategy (Improved Deepest Bottom Left with Fill)

The algorithm implements the I-DBLF placement heuristic which prioritizes:
- **Depth**: Places items further back in the container (maximizing Z coordinate)
- **Height**: Prefers lower positions to build a stable base (minimizing Y coordinate)  
- **Left**: Favors leftmost positions (minimizing X coordinate)
- **Compactness**: Rewards placements adjacent to existing items
- **Support**: Ensures adequate support area for stacking stability

### 2. Hybrid Scoring System

Each potential placement is evaluated using a weighted scoring function:

```javascript
score = (depth_weight × depth_ratio) + 
        (height_weight × height_ratio) + 
        (left_weight × left_ratio) + 
        (compactness_weight × compactness_score) +
        (support_weight × support_score)
```

**Default Weights:**
- Depth: 30%
- Height: 25%
- Left: 20%
- Compactness: 15%
- Support: 10%

The final hybrid score combines:
- **30%** I-DBLF heuristic score (strategic placement quality)
- **70%** Base area score (volume efficiency)

### 3. Best-Fit Orientation Selection

For each item at each open point, the algorithm:
1. Evaluates all available rotations
2. Checks spatial constraints (container bounds, shelf limits)
3. Validates collision-free placement
4. Verifies support requirements (≥75% base support for stacking)
5. Calculates placement score for each valid orientation
6. Selects the orientation with the highest score

### 4. Shelf-Based Layering

The container is divided into horizontal shelves:
- Each shelf is packed independently
- Vertical space allocated: `(container_height / num_shelves) - shelf_thickness`
- Items that don't fit in current shelf are deferred to higher shelves
- Fallback pass uses full container height for remaining items

### 5. Advanced Space Management

**Compactness Scoring:**
- Measures adjacency to existing items on X and Z axes
- Rewards placements that fill gaps and create dense packing
- Normalized to 0-1 scale (max 4 adjacent sides)

**Support Validation:**
- Requires minimum 75% base support for stacking
- Ground-level items have perfect support (100%)
- Calculates overlapping area with items below

**Extreme Point Generation:**
- Creates new placement candidates from corners of placed items
- Prunes dominated and redundant points
- Maintains sorted priority (ground-level first)

## Algorithm Flow

### Initialization
```
1. Initialize open points: [{x:0, y:0, z:0}]
2. Set shelf parameters (spacing, thickness, divisions)
3. Compute stacking capacity per item
4. Initialize tracking (failed points, shelf utilization)
```

### Layer-by-Layer Packing
```
FOR each shelf layer:
    Reset open points and failed-point memory
    
    FOR each remaining item:
        best_placement = null
        best_score = -∞
        
        FOR each open point:
            Skip if previously failed for this item
            
            FOR each rotation:
                Check: fits in container & shelf
                Check: no collisions
                Check: adequate support (if stacking)
                
                score = calculatePlacementScore()
                
                IF score > best_score:
                    best_placement = {point, rotation}
                    best_score = score
        
        IF best_placement found:
            Place item at best_placement
            Update shelf utilization
            Generate new extreme points
            Remove placed item from queue
        ELSE:
            Mark all points as failed for this item
    
    Log shelf statistics
    Continue to next layer with remaining items
```

### Fallback Pass
```
IF items remain after all shelves:
    Use full container height
    Regenerate open points from placed items
    Attempt placement with relaxed constraints
```

## Implementation Details

### Key Methods

**`calculatePlacementScore(pack, point, container, orientation)`**
- Computes weighted I-DBLF score for a placement
- Returns: 0-100 score (higher = better)

**`calculateCompactness(pack, point, orientation)`**
- Measures adjacency to existing items
- Returns: 0-1 normalized score

**`calculateSupportScore(pack, point, orientation)`**
- Validates stacking support requirements
- Returns: 0-1 ratio (0.75+ required for non-ground)

**`findBestFitOrientation(pack, point, container)`**
- Evaluates all rotations at a point
- Returns: `{orientationIndex, fits, score}`

**`hasOverlap1D(a1, a2, b1, b2)`**
- Checks 1D range overlap for adjacency detection
- Used in compactness calculation

### Performance Optimizations

1. **Failed Point Caching**: Avoids retrying impossible placements
2. **Rotation Short-Circuit**: Stops checking variants once a fit is found
3. **Sorted Open Points**: Ground-level prioritized for horizontal fill first
4. **Incremental Point Generation**: Only creates points for newly placed items

## Configuration

### Adjustable Parameters

**Scoring Weights** (in `calculatePlacementScore`):
```javascript
const weights = {
    depth: 30,      // Prefer back positions
    height: 25,     // Prefer lower positions
    left: 20,       // Prefer left positions
    compactness: 15,// Prefer gap-filling
    support: 10     // Prefer stable stacking
};
```

**Hybrid Blend** (in solve method):
```javascript
// 30% strategic (I-DBLF), 70% volume efficiency
hybridScore = (idblfScore * 0.3) + (baseAreaScore * 0.7)
```

**Support Threshold**:
```javascript
const MIN_SUPPORT_RATIO = 0.75; // 75% base support required
```

### Container Configuration

```javascript
container = {
    w: width,              // Container width
    h: height,             // Container height
    l: length,             // Container length
    shelves: 4,            // Number of shelf divisions
    shelfThickness: 8,     // Physical thickness of shelves
    rackBaseHeight: -75    // Base elevation
}
```

## Output Statistics

The algorithm logs comprehensive statistics:

```
=== Hybrid I-DBLF Packing Complete ===
Packed Items: 42
Volume Utilization: 78.45%
Shelf Utilization: {
  0: 125000,  // Bottom shelf volume used
  1: 98000,   // Shelf 1 volume used
  2: 87000,   // Shelf 2 volume used
  3: 65000    // Top shelf volume used
}
```

Per-item placement logs:
```
✓ Placed pack 5 at (100,0,200) dims 50x30x40 [I-DBLF: 72.35, Hybrid: 68420.71]
```

## Theoretical Foundation

This implementation is based on:

1. **I-DBLF Heuristic**: Improved Deepest Bottom Left with Fill strategy for 3D bin packing
2. **Best-Fit Decreasing (BFD)**: Sorted items by volume, evaluate all orientations
3. **Extreme Points**: Maintains candidate placement points generated from item corners
4. **Multi-Criteria Scoring**: Balances multiple objectives (compactness, stability, efficiency)

## Comparison to Basic Algorithms

| Feature | Basic FFD | This Hybrid I-DBLF |
|---------|-----------|-------------------|
| Placement Strategy | First-fit | Best-fit with scoring |
| Orientation Selection | Try until fit | Evaluate all, choose best |
| Space Utilization | Volume-based | Multi-criteria weighted |
| Support Validation | Basic | 75% area threshold |
| Compactness | Not considered | Actively optimized |
| Statistics | Basic | Comprehensive per-shelf |

## Future Enhancements

Potential improvements based on research literature:

1. **Genetic Algorithm Layer**: Population-based optimization of item sequence
2. **GAN-Enhanced Diversity**: Prevent premature convergence in search space
3. **Deep RL Integration**: Learn optimal weight configurations from training data
4. **Parallel Evaluation**: Multi-threaded placement scoring for large item sets
5. **Dynamic Weight Adaptation**: Adjust weights based on container fill ratio

## References

- Hybrid Genetic Algorithm with I-DBLF for 3D-BPP
- Hybrid Heuristic Proximal Policy Optimization (HHPPO) framework
- GAN-based Genetic Algorithms for bin packing
- Class-Constrained Shelf Bin Packing (CCSBP) methods

---

**Implementation Date**: January 2026  
**Algorithm Version**: 1.0  
**Language**: JavaScript (ES6+)  
**Framework**: Three.js for 3D visualization
