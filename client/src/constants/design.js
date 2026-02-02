/**
 * Nexus Cloud Enterprise Design System
 * STRICT color palette - DO NOT MODIFY
 */

export const COLORS = {
  // ENTERPRISE PALETTE (EXACT)
  LIGHT_BG: '#E2DED3',          // Light background
  MUTED: '#857671',              // Muted neutral
  DARK_PRIMARY: '#4E413B',       // Dark primary
  ACCENT: '#FF6D24',             // Action / Accent (orange)

  // DARK MODE TEXT (HIGH CONTRAST)
  TEXT_PRIMARY_DARK: '#E2DED3',                    // Primary on dark
  TEXT_SECONDARY_DARK: 'rgba(226,222,211,0.75)', // Secondary on dark
  TEXT_MUTED_DARK: 'rgba(226,222,211,0.55)',     // Muted on dark

  // LIGHT MODE TEXT
  TEXT_PRIMARY_LIGHT: '#4E413B',                  // Primary on light
  TEXT_SECONDARY_LIGHT: '#857671',                // Secondary on light
  TEXT_MUTED_LIGHT: 'rgba(78,65,59,0.55)',       // Muted on light

  // BACKGROUNDS
  OFF_WHITE: '#E2DED3',
  DARK_BG: '#4E413B',
  CARD_BG_DARK: 'rgba(226,222,211,0.06)',
  CARD_BG_LIGHT: 'rgba(226,222,211,0.08)',

  // DEPRECATED (for backward compat)
  SAGE: '#FF6D24',
  SAGE_DARK: '#E85A0D',
  BEIGE: '#E2DED3',
  CHARCOAL: '#4E413B',
  OFF_WHITE_OLD: '#E2DED3',
  TEXT_PRIMARY: '#E2DED3',
  TEXT_SECONDARY: 'rgba(226,222,211,0.75)',
  TEXT_MUTED: 'rgba(226,222,211,0.55)',
};

export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
};

export const TYPOGRAPHY = {
  HEADING_XL: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '32px',
  },
  HEADING_LG: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '28px',
  },
  HEADING_MD: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '26px',
  },
  BODY_LG: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '24px',
  },
  BODY_MD: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '20px',
  },
  BODY_SM: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '16px',
  },
};

export const SHADOWS = {
  SOFT: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
  SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px rgba(0, 0, 0, 0.07)',
};

export const BORDER_RADIUS = {
  SM: '4px',
  MD: '6px',
  LG: '12px',
};

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 100,
  BASE: 1,
};
