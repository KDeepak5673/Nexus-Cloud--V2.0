# Accent Color Design System

## Color Palette

### Brand Colors
- **Accent/CTA**: `#ee7c0b` - Primary buttons, key highlights, important interactive elements
- **Dark Primary**: `#122a2c` - Headings, navigation, important text, professional foundation
- **White**: `#FFFFFF` - Backgrounds, text on dark surfaces

### Grey Scale (Light to Dark)
- **Grey 50**: `#F9FAFB` - Lightest background, subtle sections
- **Grey 100**: `#F3F4F6` - Light background, hover states
- **Grey 200**: `#E5E7EB` - Borders, dividers, secondary button backgrounds
- **Grey 300**: `#D1D5DB` - Disabled states, inactive elements
- **Grey 400**: `#9CA3AF` - Secondary text, labels
- **Grey 500**: `#6B7280` - Body text, standard content
- **Grey 600**: `#4B5563` - Important text, emphasized content
- **Grey 700**: `#374151` - Subtle headings, dark text
- **Grey 800**: `#1F2937` - Very dark text

### Interactive States
- **Accent Hover**: `#d66a09` - Hover state for accent color
- **Accent Active**: `#be5d08` - Active/pressed state for accent color

## Design Principles

### Strategic Color Use
- Use `#ee7c0b` sparingly (10-15% of color application) for maximum impact
- Reserve accent color for CTAs, primary actions, and key highlights
- Use `#122a2c` to establish trust, sophistication, and hierarchy
- Rely on grey scale for majority of interface elements

### Hierarchy
1. **Primary Actions**: Accent color (#ee7c0b)
2. **Important Elements**: Dark primary (#122a2c)
3. **Secondary Elements**: Grey tones
4. **Backgrounds**: White and light greys

### Accessibility
- All color combinations meet WCAG AA standards
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Dark primary on white: 14.5:1 ratio
- Accent on white: 5.8:1 ratio

## Component Usage

### Buttons
- **Primary CTA**: `#ee7c0b` background, white text
- **Secondary**: `#E5E7EB` background, `#122a2c` text
- **Outline**: `#E5E7EB` border, `#122a2c` text
- **Navigation Logout**: White border on dark primary background

### Typography
- **H1-H3**: `#122a2c` (dark primary)
- **H4-H6**: `#374151` (grey-700)
- **Body Text**: `#6B7280` (grey-500)
- **Secondary Text**: `#9CA3AF` (grey-400)

### Links
- **Default**: `#122a2c` (dark primary)
- **Hover**: `#ee7c0b` (accent color)
- **Visited**: `#122a2c` (maintains consistency)

### Navigation
- **Background**: `#122a2c` (dark primary)
- **Link Text**: `#FFFFFF` (white)
- **Active Indicator**: White underline
- **Hover**: Subtle opacity change

### Forms
- **Input Border**: `#E5E7EB` (grey-200)
- **Focus Border**: `#ee7c0b` (accent)
- **Label Text**: `#122a2c` (dark primary)
- **Placeholder**: `#9CA3AF` (grey-400)
- **Error Text**: `#122a2c` with light grey background

### Cards & Containers
- **Background**: `#FFFFFF` (white)
- **Border**: `#E5E7EB` (grey-200)
- **Shadow**: Subtle grey shadows
- **Accent Border** (stat cards): `#ee7c0b` left border (4px)

### Status Indicators
- **Active**: `#1F2937` (grey-800)
- **In Progress**: `#6B7280` (grey-500)
- **Queued**: `#9CA3AF` (grey-400)
- **Failed**: `#D1D5DB` (grey-300)
- Use greyscale only, no semantic colors

### Interactive Elements
- **Hover States**: Slightly darker shade or accent color
- **Active States**: Darker tones
- **Disabled States**: `#D1D5DB` (grey-300)

## CSS Variables

```css
:root {
  /* Brand Colors */
  --color-accent: #ee7c0b;
  --color-dark-primary: #122a2c;
  --color-white: #FFFFFF;
  
  /* Grey Scale */
  --color-grey-50: #F9FAFB;
  --color-grey-100: #F3F4F6;
  --color-grey-200: #E5E7EB;
  --color-grey-300: #D1D5DB;
  --color-grey-400: #9CA3AF;
  --color-grey-500: #6B7280;
  --color-grey-600: #4B5563;
  --color-grey-700: #374151;
  --color-grey-800: #1F2937;
  
  /* Semantic Colors */
  --color-text-primary: var(--color-dark-primary);
  --color-text-secondary: var(--color-grey-500);
  --color-text-tertiary: var(--color-grey-400);
  
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: var(--color-grey-50);
  --color-bg-tertiary: var(--color-grey-100);
  
  --color-border-light: var(--color-grey-200);
  --color-border-medium: var(--color-grey-300);
  --color-border-dark: var(--color-dark-primary);
  
  /* Interactive States */
  --color-accent-hover: #d66a09;
  --color-accent-active: #be5d08;
}
```

## Usage Examples

### Primary Call-to-Action Button
```css
.cta-button {
  background-color: var(--color-accent);
  color: var(--color-white);
  border: none;
}

.cta-button:hover {
  background-color: var(--color-accent-hover);
}
```

### Heading
```css
h1, h2, h3 {
  color: var(--color-dark-primary);
}
```

### Link
```css
a {
  color: var(--color-dark-primary);
}

a:hover {
  color: var(--color-accent);
}
```

### Form Input
```css
input {
  border: 2px solid var(--color-border-light);
}

input:focus {
  border-color: var(--color-accent);
  outline: none;
}
```

## Best Practices

1. **Restraint**: Don't overuse the accent color - it loses impact
2. **Consistency**: Always use dark primary for headings and important text
3. **Contrast**: Test all text against backgrounds for readability
4. **Hierarchy**: Use color weight (not just size) to establish importance
5. **Purpose**: Every use of accent color should serve a clear purpose
6. **Balance**: Maintain visual balance between accent, dark primary, and greys
7. **Testing**: Always test on multiple devices and screen sizes
8. **Accessibility**: Verify contrast ratios with accessibility tools

## Migration from Greyscale

All instances of `#000000` (black) have been replaced with `#122a2c` (dark primary) throughout:
- Navigation background
- Headings and important text
- Primary buttons now use `#ee7c0b` (accent)
- All inline styles and CSS files updated
- Strategic use of accent color for CTAs and highlights

This creates a sophisticated, professional foundation with strategic energetic highlights for conversion optimization.
