# White-Label Admin Settings UI - Documentation

## Overview

A comprehensive admin settings interface that manages all aspects of a white-label restaurant system. This UI syncs seamlessly with your backend API endpoints and provides real-time updates with full RTL (Arabic/English) support.

## File Structure

```
client/src/features/settings/
├── components/
│   └── SettingsLayout.jsx          # Main layout with tab navigation
├── pages/
│   ├── SystemSettings.jsx          # General, location, functionality, policies
│   ├── ServiceSettings.jsx         # Pickup, delivery, dine-in, table booking
│   ├── PaymentMethodsSettings.jsx  # CRUD for payment methods
│   ├── WebsiteDesignSettings.jsx   # Colors, fonts, domain, SEO, social, code
│   ├── IntegrationsSettings.jsx    # Third-party integrations (Stripe, Twilio, etc)
│   ├── BrandingSettings.jsx        # Logo, favicon, brand info, colors
│   └── ContentSettings.jsx         # FAQs and policies (terms, privacy, etc)
├── hooks/
│   └── useSettingsAPI.js           # All API calls for settings
└── pages/admin/Settings.jsx        # Main settings page (updated)
```

## Components Guide

### SettingsLayout.jsx

The main container component that provides:

- **Tab Navigation**: Sidebar on desktop, horizontal tabs on mobile
- **RTL Support**: Automatic layout adjustment for Arabic
- **Dark Mode**: Full dark theme support
- **Responsive Design**: Adapts to all screen sizes
- **Section Switching**: Seamless navigation between settings categories

**Props:**

- `activeSection` - Current active tab (string)
- `onSectionChange` - Callback when user changes tabs
- `children` - Content to display

### System Settings

Manages general restaurant settings across 4 categories:

#### 1. General Settings

- Restaurant name (English & Arabic)
- Description
- Phone & Email
- Toggles for review, rewards, promo codes, guest checkout

#### 2. Location Settings

- Address (English & Arabic)
- City, Country, Coordinates
- Latitude & Longitude for map integration

#### 3. Functionality Settings

- Enable/disable reviews
- Enable/disable rewards system
- Enable/disable promo codes
- Allow guest checkout

#### 4. Policies Settings

- Minimum/maximum order amounts
- Delivery radius (km)
- Estimated delivery time

**Features:**

- Accordion-style collapsed categories
- Real-time input handling
- Type validation (text, email, tel, number, toggle)
- Save/cancel functionality
- Change tracking (hasChanges state)

### Service Settings

Manages 4 service types with toggle and configuration:

1. **Pickup Service**

   - Estimated pickup time (minutes)

2. **Delivery Service**

   - Estimated delivery time
   - Delivery fee
   - Delivery radius

3. **Dine-In Service**

   - Estimated time
   - Table capacity

4. **Table Booking**
   - Advance booking time (hours)
   - Min/max party size

**Features:**

- Service enable/disable toggle
- Conditional field display (only show when enabled)
- Time-aware input fields
- Bulk save operation

### Payment Methods Settings

Full CRUD management for payment methods:

**Fields per Method:**

- Name (English & Arabic)
- Type (credit card, wallet, bank, cash, Apple Pay, Google Pay)
- Transaction fee (%)
- Description (English & Arabic)
- Enable/disable toggle

**Features:**

- Add new payment methods
- Edit existing methods
- Delete payment methods
- Toggle methods on/off
- Grid layout for multiple methods
- Form validation
- Icon support (CreditCard icons)

### Website Design Settings

Comprehensive website customization with real-time preview:

**Tabs:**

1. **Colors**

   - Primary, Secondary, Accent, Background, Text colors
   - Color picker + hex input
   - Real-time preview

2. **Fonts**

   - Primary & secondary fonts
   - Dropdown selection
   - Font family support

3. **Domain**

   - Subdomain configuration
   - Format: subdomain.brandbite.com

4. **SEO**

   - Page title (60 chars limit)
   - Meta description (160 chars limit)
   - Keywords (comma-separated)
   - Real-time character count

5. **Social Media**

   - Facebook URL
   - Instagram URL
   - Twitter/X URL
   - TikTok URL
   - LinkedIn URL

6. **Custom Code**
   - Header code injection
   - Footer code injection
   - HTML/JS support

**Features:**

- Live preview panel (sticky sidebar)
- Color palette visualization
- Font preview
- Tab-based organization
- Character count for SEO fields

### Integrations Settings

Connect external services with 8 pre-configured integrations:

1. **Facebook Pixel**

   - Pixel ID tracking

2. **Google Analytics**

   - Tracking ID configuration

3. **Google Tag Manager**

   - Container ID setup

4. **Mailchimp**

   - API Key & Audience ID

5. **Stripe**

   - Publishable & Secret keys

6. **Twilio**

   - Account SID, Auth Token, Phone number

7. **SendGrid**

   - API Key & Sender email

8. **Slack**
   - Webhook URL & Channel name

**Features:**

- Enable/disable integrations
- Conditional field display
- Password field masking
- Emoji icons for visual identification
- Individual save per integration

### Branding Settings

Complete brand identity management:

**Logo Management:**

- Upload main logo (PNG, JPG, GIF)
- Upload favicon
- Image preview with delete option
- Drag & drop support

**Brand Information:**

- Brand name (English & Arabic)
- Tagline (English & Arabic)
- Description (English & Arabic)

**Color Palette:**

- Primary color picker
- Secondary color picker
- Accent color picker
- Color preview blocks
- Hex code input

**Features:**

- File upload with validation
- Image preview
- Color selection with hex/picker dual input
- Sticky color palette sidebar
- Upload progress indication

### Content Settings

Manage FAQs and policies:

**FAQs Section:**

- Add new FAQs
- Edit existing FAQs
- Delete FAQs
- Categorization (general, ordering, payment, delivery, account, returns)
- Bilingual support (English & Arabic)
- Form with category selector
- Answer preview (line-clamp 2)

**Policies Section:**

- Terms of Service
- Privacy Policy
- Cancellation Policy
- Return Policy
- Bilingual support for each

**Features:**

- Tab-based navigation
- CRUD operations for FAQs
- Inline editing
- Category filtering
- Textarea for long-form content
- Bilingual editing for all fields

## API Integration

### useSettingsAPI Hook

Custom React hook that handles all API communication. Provides methods for:

**System Settings:**

- `getSystemSettings()`
- `updateSystemSettings(settings)`
- `updateSystemCategory(category, data)`

**Services:**

- `getServices()`
- `updateServices(services)`
- `toggleService(service, enabled)`

**Payment Methods:**

- `getPaymentMethods()`
- `addPaymentMethod(method)`
- `updatePaymentMethod(methodId, updates)`
- `removePaymentMethod(methodId)`
- `togglePaymentMethod(methodId, enabled)`

**Website Design:**

- `getWebsiteDesign()`
- `updateWebsiteDesign(design)`
- `updateWebsiteColors(colors)`

**Integrations:**

- `getIntegrations()`
- `updateIntegration(integration, settings)`
- `toggleIntegration(integration, enabled)`

**Content:**

- `getFAQs()`
- `addFAQ(faq)`
- `updateFAQ(faqId, faq)`
- `removeFAQ(faqId)`
- `getPolicies()`
- `updatePolicies(policies)`

**File Uploads:**

- `uploadLogo(file)`

### Features:

- Automatic error handling with toast notifications
- Loading state management
- Success/error callbacks
- Automatic data refresh on mutations

## Backend Endpoints

All endpoints are protected with authentication and admin role middleware.

```
GET    /api/restaurant/system-settings
PUT    /api/restaurant/system-settings
PUT    /api/restaurant/system-settings/:category

GET    /api/restaurant/services
PUT    /api/restaurant/services
PUT    /api/restaurant/services/:service/toggle

GET    /api/restaurant/payment-methods
POST   /api/restaurant/payment-methods
PUT    /api/restaurant/payment-methods/:methodId
DELETE /api/restaurant/payment-methods/:methodId
PUT    /api/restaurant/payment-methods/:methodId/toggle

GET    /api/restaurant/website-design
PUT    /api/restaurant/website-design
PUT    /api/restaurant/website-design/colors

GET    /api/restaurant/integrations
PUT    /api/restaurant/integrations/:integration
PUT    /api/restaurant/integrations/:integration/toggle

GET    /api/restaurant/faqs
POST   /api/restaurant/faqs
PUT    /api/restaurant/faqs/:faqId
DELETE /api/restaurant/faqs/:faqId

GET    /api/restaurant/policies
PUT    /api/restaurant/policies

POST   /api/restaurant/upload-logo (multipart)
```

## RTL Support

All components automatically adjust for Arabic (RTL) layout:

- Text alignment
- Flex direction
- Padding/margin flipping
- Border positions

Detected via `i18n.language === 'ar'` from react-i18next.

## Styling

- **Tailwind CSS**: Utility-first styling
- **Dark Mode**: Full support with `dark:` prefix classes
- **Color Scheme**:
  - Primary: Blue-600
  - Success: Green-500
  - Danger: Red-600
  - Warning: Orange-500
  - Info: Blue-500
- **Responsive Breakpoints**:
  - Mobile-first design
  - `md:` breakpoint at 768px
  - `lg:` breakpoint at 1024px

## Error Handling

- Toast notifications for all operations
- User-friendly error messages
- Loading states during API calls
- Validation feedback
- Network error handling

## Performance Optimizations

- Lazy loading of settings sections
- Conditional field rendering
- Memoized API calls
- Efficient state management
- Image optimization for uploads

## Form Validation

**System Settings:**

- Required fields highlighted
- Type validation (email, tel, number)
- Min/max constraints

**Payment Methods:**

- Name required
- Type required
- Fee must be positive number

**Website Design:**

- Character limits for SEO (title 60, description 160)
- URL validation for social media
- Color format validation

**Content:**

- Question & answer required for FAQs
- Policy content validation

## Usage Example

```jsx
import Settings from "./pages/admin/Settings";

export default function AdminPanel() {
  return <Settings />;
}
```

The settings page will render with all tabs and handle state management automatically.

## Customization

### Adding a New Settings Category

1. **Create new page component:**

   ```jsx
   // client/src/features/settings/pages/NewSettings.jsx
   export default function NewSettings() {
     const { i18n } = useTranslation();
     const { loading, newAPI } = useSettingsAPI();
     // Component logic
   }
   ```

2. **Add to SettingsLayout tabs:**

   ```jsx
   const sections = [
     // ... existing sections
     { id: "new", label: "New Settings", icon: Icon },
   ];
   ```

3. **Update Settings.jsx:**

   ```jsx
   case 'new': return <NewSettings />;
   ```

4. **Add API methods to useSettingsAPI.js**

### Styling Customization

- Modify color scheme in component files
- Update Tailwind classes
- Add custom CSS modules if needed
- Dark mode variants use `dark:` prefix

## Testing Checklist

- [ ] All tabs navigate correctly
- [ ] Form inputs update state
- [ ] Save/cancel buttons work
- [ ] Loading states display
- [ ] Toast notifications appear
- [ ] RTL layout adjusts correctly
- [ ] Dark mode renders properly
- [ ] File uploads work
- [ ] Color pickers function
- [ ] Mobile responsive on all sizes
- [ ] API calls succeed/fail appropriately
- [ ] Validation messages display

## Known Limitations

1. Favicon upload needs backend implementation
2. Custom code injection is client-side only
3. SEO preview doesn't show live on site
4. Color changes don't update CSS variables automatically
5. Image compression not implemented
6. Bulk import/export not yet available

## Future Enhancements

- [ ] Bulk operations (export/import settings)
- [ ] Settings backup & restore
- [ ] Scheduled updates
- [ ] Change history/audit log
- [ ] Template presets
- [ ] A/B testing integrations
- [ ] Advanced analytics dashboard
- [ ] Settings validation rules
- [ ] Multi-language support for more languages
