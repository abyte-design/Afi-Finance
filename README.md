# 💜 AFI Finance App

A retro-cyberpunk personal finance management application with a dark, neon-inspired aesthetic. Track income and expenses, manage transactions, analyze spending patterns, and share financial statistics with a gaming-inspired UI.

## 🎮 Features

### Core Finance Management
- **Add Transactions** - Record income and expenses with categories, dates, and notes
- **Receipt Scanner** - AI-powered receipt scanning to auto-fill transaction details
- **Transaction History** - View, search, filter, and edit all transactions with monthly summaries
- **Real-time Analytics** - Visualize spending patterns with bar charts and pie charts
- **Multi-currency Support** - Support for 19+ currencies (USD, EUR, IDR, JPY, GBP, CAD, AUD, etc.)

### User Features
- **Authentication** - Secure login with Supabase
- **Cloud Sync** - Real-time data synchronization across devices
- **Biometric Login** - Face/Touch ID support
- **User Profiles** - Customizable profile with avatar upload
- **Social Sharing** - Share financial snapshots to Instagram Stories

### UI/UX
- **Retro Cyberpunk Aesthetic** - Neon colors, pixel fonts (Press Start 2P), glowing effects
- **Mobile-First Design** - Optimized for 430px max-width with responsive scaling
- **Bottom Sheets** - Scrollable modals for editing and interaction
- **Real-time Validation** - Instant feedback on form inputs
- **Dark Mode** - Eyes-friendly dark theme throughout

## 🏗️ Tech Stack

- **Frontend**: React 18.3 + TypeScript
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4.1 + Inline Styles
- **State Management**: React Context API
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Build**: Vite 6
- **Package Manager**: npm/pnpm

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── shared/          # Reusable components (Layout, BottomSheet, ConfirmDialog)
│   │   ├── transactions/    # Transaction management (Add, History, Scanner)
│   │   ├── analytics/       # Charts and statistics
│   │   ├── profile/         # User profile settings
│   │   ├── auth/            # Authentication screens
│   │   ├── admin/           # Admin dashboard
│   │   ├── dashboard/       # Main dashboard
│   │   └── ui/              # Base UI components (Button, Input, Select, etc)
│   ├── context/             # React Context (Auth, Currency)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and API
│   └── routes.tsx           # Route definitions
├── imports/                 # Design assets and images
└── styles/                  # Global CSS and theme

## 🎨 Design System

The app follows a comprehensive design system documented in `DESIGN.md`:

- **Color Palette**: Custom dark theme with neon accents
  - Primary: `#0A091C` (Background)
  - Accent Colors: Income `#00E57E`, Expense `#FF4D8D`, Primary `#8B5CF6`
- **Typography**: Press Start 2P (headers) + System-ui (body)
- **Components**: BottomSheet, Button, Input, Card, Badge patterns
- **Responsive Design**: Mobile-first with adaptive scaling

## 🔄 Reusable Components

### BottomSheet Component
A flexible bottom sheet component for modals and dialogs with:
- Scrollable content area
- Fixed header and optional footer
- Responsive to device width
- Used in: Transaction editing, currency picker, share modal

See `COMPONENTS.md` for complete component documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Key Screens

1. **Dashboard** - Overview of income, expenses, and top categories
2. **Add Transaction** - Form to record new income/expense with scanner option
3. **History** - List of all transactions with search, filter, and edit capabilities
4. **Analytics** - Charts showing spending trends and patterns
5. **Profile** - User settings, currency selection, and preferences

## 🔐 Security Features

- JWT-based authentication via Supabase
- Encrypted cloud sync
- Biometric login support
- Secure file uploads for avatars
- RLS (Row Level Security) on database

## 📊 Currency Support

Supports 19+ currencies with automatic formatting:
- Integer currencies (IDR, KRW, etc.) - no decimal places
- Decimal currencies (USD, EUR, etc.) - 2 decimal places
- Automatic thousand separators and symbol placement

## 🎯 Recent Updates

- ✅ Created reusable BottomSheet component for consistent modals
- ✅ Added comprehensive DESIGN.md system documentation
- ✅ Refactored all bottom sheets to use new component
- ✅ Improved responsive design for all device widths
- ✅ Enhanced scrollability for content-heavy modals

## 📖 Documentation

- `DESIGN.md` - Complete design system reference
- `COMPONENTS.md` - Component library and usage guide
- Original Design: https://www.figma.com/design/fTnWp84DM8xXDSnzxEMRBJ/AFI-Finance-app

## 🛠️ Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## 📄 License

This project is created as a Figma Make bundle. See the original design for more information.

---

**Made with 💜 by Alif Lakipadada**