// Shared utilities for Recipe Lab Notebook

// Unicode fraction map
const FRACTIONS = {
  0.125: '\u215B', // 1/8
  0.25: '\u00BC',  // 1/4
  0.333: '\u2153', // 1/3
  0.375: '\u215C', // 3/8
  0.5: '\u00BD',   // 1/2
  0.625: '\u215D', // 5/8
  0.666: '\u2154', // 2/3
  0.75: '\u00BE',  // 3/4
  0.875: '\u215E'  // 7/8
};

// Muted palette for tag colors
const TAG_COLORS = [
  '#B0C4DE', '#DEB887', '#B0E0E6', '#D2B48C',
  '#C8D8C8', '#E6D5B8', '#C4AEAD', '#B8C4D0',
  '#D4C5A9', '#C0C0C0'
];

/**
 * Format a quantity with optional unit, using Unicode fractions
 * Supports quantityMax for ranges (e.g., "4–6")
 */
function formatQuantity(num, unit, numMax) {
  if (num === null || num === undefined) return '';

  const formatSingle = (n) => {
    if (Number.isInteger(n)) {
      return n.toString();
    }

    const whole = Math.floor(n);
    const frac = n - whole;

    let closestFrac = '';
    let minDiff = 1;

    for (const [key, symbol] of Object.entries(FRACTIONS)) {
      const diff = Math.abs(frac - parseFloat(key));
      if (diff < minDiff && diff < 0.05) {
        minDiff = diff;
        closestFrac = symbol;
      }
    }

    if (closestFrac) {
      return whole > 0 ? `${whole}${closestFrac}` : closestFrac;
    } else {
      return n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
    }
  };

  let result;
  if (numMax !== null && numMax !== undefined && numMax !== num) {
    result = `${formatSingle(num)}–${formatSingle(numMax)}`;
  } else {
    result = formatSingle(num);
  }

  return unit ? `${result} ${unit}` : result;
}

/**
 * Get a consistent color for a tag based on hash
 */
function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// Export to window for use across pages
window.formatQuantity = formatQuantity;
window.getTagColor = getTagColor;
window.FRACTIONS = FRACTIONS;
