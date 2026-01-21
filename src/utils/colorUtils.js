/**
 * Color utility functions for converting hex colors to OKLab format
 * Used for dynamic category color theming
 */

/**
 * Convert hex color to OKLab format for perceptual color mixing
 * @param {string} hex - Hex color string (e.g., "#F892A5")
 * @returns {string} OKLab color string (e.g., "oklch(0.76 0.13 20)")
 */
export function hexToOKLab(hex) {
  // Remove # if present
  hex = hex.replace('#', '')

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  // Convert RGB to linear RGB
  const toLinear = (c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)

  // Convert linear RGB to XYZ (D65 illuminant)
  const x = 0.4124564 * rLinear + 0.3575761 * gLinear + 0.1804375 * bLinear
  const y = 0.2126729 * rLinear + 0.7151522 * gLinear + 0.0721750 * bLinear
  const z = 0.0193339 * rLinear + 0.1191920 * gLinear + 0.9503041 * bLinear

  // Convert XYZ to OKLab
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  // Convert Lab to LCh
  const C = Math.sqrt(a * a + b_ * b_)
  let h = Math.atan2(b_, a) * (180 / Math.PI)
  if (h < 0) h += 360

  // Round to reasonable precision
  const lightness = Math.round(L * 100) / 100
  const chroma = Math.round(C * 100) / 100
  const hue = Math.round(h)

  return `oklch(${lightness} ${chroma} ${hue})`
}

/**
 * Get the palette of predefined category colors
 * These colors are designed to be perceptually balanced and work well
 * with the OKLab color mixing system for subtle category tinting
 */
export const CATEGORY_COLOR_PALETTE = [
  '#7AB4F4', // Sky Blue
  '#83C594', // Mint Green
  '#F2BC5C', // Amber
  '#C98FD7', // Violet
  '#F892A5', // Rose
  '#FAA571', // Coral
  '#B1CA62', // Lime
  '#64C3C7', // Teal
  '#999EF7', // Indigo
  '#B5B9C6', // Slate
]

/**
 * Get OKLab representation of a category color
 * Falls back to a default if color is invalid
 * @param {string} hexColor - Hex color string
 * @returns {string} OKLab color string
 */
export function getCategoryOKLab(hexColor) {
  if (!hexColor) return null

  try {
    return hexToOKLab(hexColor)
  } catch (error) {
    console.warn('Invalid color format, using default:', hexColor)
    return hexToOKLab(CATEGORY_COLOR_PALETTE[0])
  }
}
