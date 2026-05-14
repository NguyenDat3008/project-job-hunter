// Typography — Refined for a minimalist and elegant look
import { Platform } from 'react-native';

export const TYPOGRAPHY = {
  // Headings - Using slightly more letter spacing for modern look
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  
  // Body text - Optimizing for readability
  body1: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  body2: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  
  // Interactive - Semi-bold for buttons and links
  button: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  buttonSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  
  // Metadata & Captions
  caption: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  captionBold: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700' as const,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export type TypographyVariant = keyof typeof TYPOGRAPHY;

export default TYPOGRAPHY;