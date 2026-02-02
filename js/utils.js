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
 * Format minutes as hours and minutes (e.g., 230 → "3h 50m")
 */
function formatTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
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

// === Theme System ===
const THEMES = {
  teal:     '#547E7E',
  slate:    '#5A6A7A',
  olive:    '#6B6B4A',
  plum:     '#6B4A5E',
  storm:    '#4A5A6B',
  charcoal: '#4A4A4A'
};

function setTheme(name) {
  if (!THEMES[name]) return;
  document.body.style.setProperty('--desktop-bg', THEMES[name]);
  document.body.style.backgroundColor = THEMES[name];
  localStorage.setItem('recipe-lab-theme', name);
  updateThemeCheckmarks(name);
}

function updateThemeCheckmarks(activeName) {
  const items = document.querySelectorAll('#theme-dropdown .menu-dropdown-item');
  items.forEach(item => {
    const checkmark = item.querySelector('.checkmark');
    const onclick = item.getAttribute('onclick');
    const match = onclick && onclick.match(/setTheme\('(\w+)'\)/);
    const themeName = match ? match[1] : null;
    if (checkmark) {
      checkmark.textContent = (themeName === activeName) ? '✓' : '';
    }
  });
}

// Apply saved theme immediately (before DOMContentLoaded)
(function() {
  const saved = localStorage.getItem('recipe-lab-theme') || 'plum';
  if (THEMES[saved]) {
    document.body.style.backgroundColor = THEMES[saved];
  }
})();

// Update checkmarks after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('recipe-lab-theme') || 'plum';
  updateThemeCheckmarks(saved);

  // Menu click handler for mobile
  const viewMenu = document.getElementById('view-menu');
  if (viewMenu) {
    viewMenu.addEventListener('click', (e) => {
      // Don't toggle when clicking dropdown items
      if (e.target.classList.contains('menu-dropdown-item')) return;
      if (e.target.classList.contains('checkmark')) return;
      viewMenu.classList.toggle('menu-open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!viewMenu.contains(e.target)) {
        viewMenu.classList.remove('menu-open');
      }
    });
  }
});

// Export to window for use across pages
window.formatQuantity = formatQuantity;
window.formatTime = formatTime;
window.getTagColor = getTagColor;
window.FRACTIONS = FRACTIONS;
window.setTheme = setTheme;
window.THEMES = THEMES;
