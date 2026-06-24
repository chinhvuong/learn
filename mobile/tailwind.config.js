// tailwind.config.js
const plugin = require('tailwindcss/plugin');
const {AppColors} = require('./src/config/colors');

function toKebab(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

const colorsConfig = Object.fromEntries(
  Object.entries(AppColors).map(([k, v]) => [toKebab(k), `rgb(var(--color-${toKebab(k)}) / <alpha-value>)`])
);

module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        // --- Inflow UI typeface: Be Vietnam Pro (UI / headings / numerals) ---
        // Full Vietnamese support, per the design handoff. The legacy `sans-*`
        // keys are repointed here so the whole app adopts the Inflow typeface;
        // weights Be Vietnam Pro doesn't ship are mapped to the nearest one.
        'sans-thin': ['"BeVietnamPro-Regular"'],
        'sans-extralight': ['"BeVietnamPro-Regular"'],
        'sans-light': ['"BeVietnamPro-Regular"'],
        'sans-regular': ['"BeVietnamPro-Regular"'],
        'sans-medium': ['"BeVietnamPro-Medium"'],
        'sans-semibold': ['"BeVietnamPro-SemiBold"'],
        'sans-bold': ['"BeVietnamPro-Bold"'],
        'sans-extrabold': ['"BeVietnamPro-ExtraBold"'],
        'sans-black': ['"BeVietnamPro-ExtraBold"'],
        // Explicit Inflow UI aliases
        'ui-regular': ['"BeVietnamPro-Regular"'],
        'ui-medium': ['"BeVietnamPro-Medium"'],
        'ui-semibold': ['"BeVietnamPro-SemiBold"'],
        'ui-bold': ['"BeVietnamPro-Bold"'],
        'ui-extrabold': ['"BeVietnamPro-ExtraBold"'],
        // --- Inflow reading surface: Newsreader serif (English lesson text) ---
        'reading': ['"Newsreader-Regular"'],
        'reading-regular': ['"Newsreader-Regular"'],
        'reading-medium': ['"Newsreader-Medium"'],
        'reading-bold': ['"Newsreader-Bold"'],
        'reading-italic': ['"Newsreader-Italic"'],
        'reading-medium-italic': ['"Newsreader-MediumItalic"'],
      },
      fontSize: {
        xs: 12,
        sm: 13,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 36,
      },
      colors: colorsConfig
    }
  },
};
