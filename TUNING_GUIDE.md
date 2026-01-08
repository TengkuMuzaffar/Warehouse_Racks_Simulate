# Hybrid I-DBLF Algorithm - Quick Tuning Guide

## 🎯 Quick Start

The algorithm is now running with optimized hybrid I-DBLF scoring. You should see improved:
- **Space utilization** (better volume efficiency)
- **Stability** (75% support requirement enforced)
- **Compactness** (items placed adjacent to each other)

## 🔧 Tuning Parameters

### 1. Scoring Weights (packer.js - `calculatePlacementScore`)

Adjust these based on your priorities:

```javascript
const weights = {
    depth: 30,      // ⬆️ Increase: pack items toward back of container
    height: 25,     // ⬆️ Increase: prioritize lower shelves more
    left: 20,       // ⬆️ Increase: pack items toward left side
    compactness: 15,// ⬆️ Increase: favor tighter packing (less gaps)
    support: 10     // ⬆️ Increase: require better support (fewer overhangs)
};
```

**Total should = 100 for consistent scoring**

#### Common Scenarios:

**Scenario: Maximize Stability (heavy items)**
```javascript
{ depth: 20, height: 35, left: 15, compactness: 10, support: 20 }
```

**Scenario: Maximize Density (small items)**
```javascript
{ depth: 25, height: 20, left: 20, compactness: 25, support: 10 }
```

**Scenario: Fast Loading (front-to-back access)**
```javascript
{ depth: 10, height: 30, left: 25, compactness: 25, support: 10 }
```

### 2. Hybrid Score Blend (packer.js - solve method)

Controls balance between strategic placement vs volume efficiency:

```javascript
// Current: 30% strategic, 70% volume
const hybridScore = (idblfScore * 0.3) + (baseAreaScore * 0.7);
```

**Adjust for:**
- **More strategic packing**: Increase I-DBLF weight to 0.4-0.5
- **More volume efficiency**: Increase base area to 0.8-0.9
- **Balanced**: Keep at 0.3/0.7

### 3. Support Requirements (packer.js - `calculateSupportScore`)

Minimum base support for stacking:

```javascript
if (supportRatio >= 0.75) // Currently 75%
```

**Adjust for:**
- **Stricter stability**: Increase to 0.80 or 0.85
- **Allow more overhang**: Decrease to 0.60 or 0.70
- **Maximum stability**: Set to 1.0 (100% support required)

### 4. Shelf Configuration (container.js)

Number of horizontal divisions:

```javascript
shelves: 4  // Default: 4 shelves
```

**Adjust for:**
- **Tall items**: Reduce to 2-3 shelves (more vertical space)
- **Many small items**: Increase to 5-6 shelves
- **No shelves**: Set to 1 (single container volume)

## 📊 Interpreting Results

### Console Output

```
✓ Placed pack 5 at (100,0,200) dims 50x30x40 [I-DBLF: 72.35, Hybrid: 68420.71]
```

- **I-DBLF Score**: Strategic placement quality (0-100, higher = better position)
- **Hybrid Score**: Combined placement value (higher = better overall fit)

### Final Statistics

```
=== Hybrid I-DBLF Packing Complete ===
Packed Items: 42
Volume Utilization: 78.45%
Shelf Utilization: { 0: 125000, 1: 98000, 2: 87000, 3: 65000 }
```

**Good Results:**
- Volume Utilization > 75%
- Even shelf utilization (no empty shelves)
- All high-priority items packed

**Poor Results Indicate:**
- Utilization < 50%: Items may be too large or poorly sized
- Uneven shelves: Adjust shelf count or height
- Many unpacked items: Check support requirements or container size

## 🚀 Performance Tips

### Improve Packing Quality

1. **Sort items by volume** (already done by FFD)
2. **Allow more rotations** in Pack configuration
3. **Reduce support threshold** if too many items fail stacking
4. **Increase compactness weight** for tighter packing

### Improve Speed

1. **Reduce rotation variants** (fewer orientations to check)
2. **Use failed-point caching** (already implemented)
3. **Limit shelf divisions** (fewer layers to process)
4. **Process smaller batches** of items at once

## 🐛 Troubleshooting

### Issue: Items not packing despite space

**Cause**: Support requirement too strict  
**Fix**: Lower support threshold from 0.75 to 0.60-0.70

### Issue: Poor space utilization

**Cause**: I-DBLF weight too high, ignoring volume  
**Fix**: Increase base area weight from 0.7 to 0.8

### Issue: Items falling off shelves

**Cause**: Insufficient collision or support checking  
**Fix**: Increase support weight in scoring, verify `maxShelfY` calculation

### Issue: Unpredictable placement

**Cause**: Scoring weights not summing to 100  
**Fix**: Normalize weights: `weight_i / sum(all_weights) * 100`

## 📈 Advanced Tuning

### Dynamic Weight Adjustment

Adapt weights based on container fill:

```javascript
const fillRatio = totalVolumePacked / containerVolume;
if (fillRatio < 0.3) {
    // Early packing: prioritize volume
    weights.compactness = 25;
    weights.depth = 20;
} else {
    // Late packing: prioritize fit
    weights.compactness = 10;
    weights.support = 15;
}
```

### Item-Specific Scoring

Apply different weights for different item types:

```javascript
if (pack.fragile) {
    weights.support = 25;  // Extra stability
    weights.height = 35;   // Lower shelves only
} else if (pack.heavy) {
    weights.height = 40;   // Bottom shelf strongly preferred
}
```

## 🎓 Learning Resources

See [HYBRID_PACKING_ALGORITHM.md](./HYBRID_PACKING_ALGORITHM.md) for:
- Detailed algorithm explanation
- Theoretical foundation
- Method documentation
- Performance analysis

## 💡 Best Practices

1. **Test with real data**: Use actual item dimensions and quantities
2. **Monitor statistics**: Track utilization trends over multiple runs
3. **Document changes**: Note parameter adjustments and their effects
4. **Validate stability**: Ensure support requirements match physical constraints
5. **Iterate carefully**: Change one parameter at a time

---

**Last Updated**: January 2026  
**Algorithm Version**: 1.0
