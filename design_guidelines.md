# MedInvest Mobile App - Design Guidelines

## Brand Identity

**Purpose**: MedInvest enables users to invest in medical innovations, research, and healthcare ventures. The app bridges healthcare advancement with financial opportunity.

**Aesthetic Direction**: **Refined/Trustworthy** - Professional yet approachable. Medical blue meets financial confidence. Clean typography, ample breathing room, subtle gradients that convey innovation without gimmicks. Think Bloomberg meets Apple Health.

**Memorable Element**: Gradient accent cards that shift from medical blue to investment green, symbolizing the healthcare-finance bridge.

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs + Floating Action)

**Tabs**:
1. **Discover** - Browse investment opportunities
2. **Portfolio** - Track investments and returns
3. **Research** - Healthcare news and insights
4. **Profile** - Account settings and documents

**Floating Action Button**: "Invest" - Primary action positioned above tab bar center

**Auth Required**: Yes (SSO with Apple Sign-In and Google Sign-In)

## Screen-by-Screen Specifications

### Login/Signup Screens
- **Stack**: Authentication (modal)
- **Layout**: Centered content, logo at top, SSO buttons, links to privacy policy/terms
- **Header**: None
- **Content**: Non-scrollable, vertically centered
- **Safe Area**: Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

### Discover Screen
- **Stack**: Discover Tab
- **Header**: Transparent, search bar, filter button (right)
- **Content**: Scrollable list of investment opportunity cards
- **Components**: Search bar, category chips (horizontal scroll), investment cards (gradient backgrounds, project name, funding goal, time remaining, expected ROI)
- **Empty State**: empty-discover.png when no results
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Investment Detail Screen
- **Stack**: Discover Tab (pushed)
- **Header**: Default with back button, share button (right)
- **Content**: Scrollable
- **Components**: Hero image, project title, funding progress bar, key metrics grid, description, risk assessment, document links, "Invest Now" button (floating at bottom)
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + 60 (floating button height) + Spacing.xl

### Portfolio Screen
- **Stack**: Portfolio Tab
- **Header**: Transparent, "Portfolio" title, notification bell (right)
- **Content**: Scrollable with summary card at top, list of investments below
- **Components**: Total value card (large, gradient), performance graph, investment list items (project name, amount invested, current value, gain/loss percentage)
- **Empty State**: empty-portfolio.png (illustration of growing plant)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Research Screen
- **Stack**: Research Tab
- **Header**: Transparent, "Research" title, bookmark button (right)
- **Content**: Scrollable list of articles
- **Components**: Featured article card (large), article list items (thumbnail, headline, source, time)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Profile Screen
- **Stack**: Profile Tab
- **Header**: Transparent, settings gear icon (right)
- **Content**: Scrollable
- **Components**: Avatar, name, verification badge, menu items (Documents, Payment Methods, Notifications, Support, Legal, Log Out)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Investment Form (Modal)
- **Triggered by**: Floating action button or "Invest Now" button
- **Header**: Custom with "Cancel" (left), "Review" (right, disabled until valid)
- **Content**: Scrollable form
- **Components**: Project summary card, amount input, payment method selector, risk acknowledgment checkbox, terms checkbox
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: insets.bottom + Spacing.xl

## Color Palette

**Primary**: #0066CC (Medical Blue) - Main actions, active states
**Secondary**: #00A86B (Investment Green) - Success, gains
**Gradient**: Linear from #0066CC to #00A86B - Featured cards
**Background**: #F8F9FA - Main background
**Surface**: #FFFFFF - Cards, modals
**Text Primary**: #1A1A1A
**Text Secondary**: #6B7280
**Error**: #DC2626 - Losses, validation errors
**Warning**: #F59E0B - Risk indicators
**Border**: #E5E7EB

## Typography

**Font**: System (SF Pro for iOS, Roboto for Android)
**Scale**:
- Hero: 32pt, Bold
- Title: 24pt, Bold
- Heading: 18pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Small: 12pt, Regular

## Visual Design

- Cards have subtle border (1px, Border color) and 12pt corner radius
- Floating action button: 56x56, Primary gradient, white icon, shadow (offset: 0,2 | opacity: 0.10 | radius: 2)
- Investment cards use gradient backgrounds with white text
- Progress bars: 8pt height, rounded, gradient fill
- Tab bar icons: Feather icons at 24pt

## Assets to Generate

**icon.png** - App icon featuring abstract medical cross merging with upward arrow
**splash-icon.png** - Simplified version of app icon for launch screen
**empty-discover.png** - Illustration of telescope looking at medical symbols and growth charts (used in Discover screen when no results)
**empty-portfolio.png** - Illustration of sprouting plant with medical leaf (used in Portfolio screen when no investments)
**avatar-default.png** - Professional circular avatar placeholder with initials (used in Profile screen)
**investment-hero-placeholder.png** - Abstract healthcare/science illustration (used in Investment Detail screen when no project image)