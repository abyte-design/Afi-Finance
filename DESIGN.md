# Afi Finance Design System

## Overview
Afi Finance uses a retro cyberpunk aesthetic with a dark theme optimized for mobile devices. The design focuses on a 430px max-width mobile-first layout with custom styling using inline styles and Tailwind CSS.

## Color Palette

### Dark Mode (Primary)
- **Background**: `#0A091C` - Primary page background
- **Outer Background**: `#06050F` - Outer container background
- **Card/Input Background**: `#13112E` - Secondary container background
- **Surface Dark**: `#0E0C2A` - Darker surface variant

### Semantic Colors
- **Income**: `#00E57E` - Green/teal for income transactions
- **Expense**: `#FF4D8D` - Pink/magenta for expense transactions
- **Primary**: `#8B5CF6` - Purple for primary actions/highlights
- **Muted**: `#4A4870` - Muted text/secondary UI
- **Border**: `#2D2A6E` - Border color
- **Text Primary**: `#E2E0FF` - Main text color
- **Text Secondary**: `#7A78A0` - Secondary text color

### Accent Gradients
- **Income Gradient**: `linear-gradient(135deg, #00A896, #00E57E)`
- **Expense Gradient**: `linear-gradient(135deg, #C62A6B, #FF4D8D)`
- **Primary Gradient**: `linear-gradient(135deg, #7C3AED, #5B21B6)`

## Typography

### Font Families
- **Display/Headers**: `'Press Start 2P', monospace` - Retro pixel font for titles, labels, and emphasis
- **Body**: `system-ui` - System font for regular text content

### Sizing
- **Extra Large Headers**: `12px` (Press Start 2P) - Page titles
- **Large Headers**: `11px` (Press Start 2P) - Section titles
- **Medium Headers**: `10px` (Press Start 2P) - Subsection titles
- **Small Label**: `9px` (Press Start 2P) - Form labels
- **Tiny Label**: `8px` (Press Start 2P) - Small UI elements
- **Body Text**: `14px` (system-ui) - Main content
- **Secondary Text**: `13px` (system-ui) - Secondary content
- **Small Text**: `11px` (system-ui) - Help text, annotations
- **Tiny Text**: `10px` (system-ui) - Meta information

## Layout

### Container
- **Max Width**: `430px` - Mobile-optimized max width
- **Min Height**: `100vh` - Full viewport height
- **Padding**: `16px` (px-4) - Standard horizontal padding
- **Vertical Spacing**: `4px-24px` - Consistent gaps

### Responsive Breakpoints
- **Mobile**: `< 430px` - Base layout
- **Tablet**: `>= 430px` - Not currently targeted, but Layout enforces max-width

## Component Patterns

### Buttons
- **Style**: Gradient backgrounds with borders and glow effects
- **Spacing**: `py-3` to `py-4` - Adequate touch targets
- **Border**: `1px solid` with accent color at 50% opacity
- **Shadow**: `0 0 15px-20px` with accent color at 20-30% opacity
- **Hover/Active**: `active:scale-95` or `active:scale-98` for feedback
- **Font**: Press Start 2P, `10px`

### Form Inputs
- **Background**: `#13112E` or `#0E0C2A`
- **Border**: `1px solid #2D2A6E`
- **Border Radius**: `2px` (minimal radius)
- **Padding**: `10px 12px` to `12px 14px`
- **Focus**: Border color changes to accent color
- **Text Color**: `#E2E0FF`

### Cards/Containers
- **Background**: `#13112E`
- **Border**: `1px solid #2D2A6E` or accent color with opacity
- **Border Radius**: `2px` to `rounded-t-lg` for bottom sheets
- **Padding**: `16px` (p-4) to `20px` (p-5)
- **Box Shadow**: Glowing effect with accent color at 10-30% opacity

### Bottom Sheets
- **Position**: Fixed bottom overlay
- **Background**: `#13112E`
- **Border**: `1px solid #2D2A6E` on top border
- **Border Radius**: `rounded-t-lg` - Rounded top corners
- **Max Width**: `430px` (inherit from Layout)
- **Max Height**: `80vh` - Allows scrolling
- **Padding**: `p-5` (20px)
- **Overlay**: `rgba(6,5,15,0.85)` - Semi-transparent dark overlay

### Category Selection Grid
- **Columns**: `grid-cols-4` - 4 columns on mobile
- **Gap**: `gap-2` - Small spacing
- **Item Size**: `py-3` - Adequate padding
- **Active State**: Colored background and border with glow

## Design Tokens

### Spacing
- `0.5`: 2px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px

### Border Styles
- Borders: `1px solid` with color variables
- Border Radius: `2px` (minimal), `rounded-sm`, `rounded-t-lg` (bottom sheets)

### Shadows
- Card Shadows: `0 0 10px-20px` with 10-30% opacity accent color
- Glow Effects: `0 0 8px-20px` with 20-80% opacity

### Transitions
- Duration: `0.15s` to `transition-all`
- Easing: `ease`, `ease-in-out`

## Component Library (shadcn/ui)

The project uses shadcn/ui components including:
- Sheet/Drawer for bottom sheets
- Dialog for modals
- ScrollArea for scrollable content
- Button, Input, Textarea, Select
- Badge, Card, Separator
- And many more...

All components are customized to match the dark cyberpunk theme.

## Responsive Design Guidelines

1. **Width Constraints**: Always use `w-full` with `max-width: 430px` container
2. **Padding**: Use horizontal padding for spacing from edges
3. **Touch Targets**: Minimum `py-3` (12px) for buttons and interactive elements
4. **Text Sizing**: Scale text based on importance, but maintain readability
5. **Overflow**: Use `overflow-y-auto` with `scrollbarWidth: 'none'` for custom scrolling

## Animation

- **Pulse**: `animate-pulse` for loading states
- **Scale**: `active:scale-95` or `active:scale-98` for button feedback
- **Transitions**: `transition-all` for smooth color/size changes
- **Text Shadow Glow**: CSS text-shadow for neon glow effects

## Accessibility Notes

- All interactive elements have sufficient padding for touch
- Color contrast meets WCAG standards in dark theme
- Labels are properly associated with form inputs
- Focus states are visible (border color changes)
