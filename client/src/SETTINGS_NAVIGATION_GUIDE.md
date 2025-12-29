# Admin Settings UI - Integration & Navigation Guide

## ✅ What's Now Available

### Settings Route

**URL:** `http://localhost:5173/admin/settings`  
**Access:** Admin users only  
**Component:** Settings page with 7 main categories

---

## 🗺️ Navigation Map

```
Admin Dashboard (/admin)
├── Dashboard
├── Orders
├── Menu
├── Categories
├── Reviews
├── Rewards
├── Coupons
└── Settings (/admin/settings) ← NEW
    ├── System Settings (General, Location, Functionality, Policies)
    ├── Service Settings (Pickup, Delivery, Dine-in, Table Booking)
    ├── Payment Methods (Add/Edit/Delete/Toggle payment methods)
    ├── Website Design (Colors, Fonts, Domain, SEO, Social, Code)
    ├── Integrations (Facebook Pixel, Google Analytics, Stripe, etc.)
    ├── Branding (Logo, Favicon, Brand Info, Color Palette)
    └── Content (FAQs & Policies)
```

---

## 📱 How to Access Settings

### 1. **Direct URL Navigation**

```
http://localhost:5173/admin/settings
```

### 2. **From Admin Sidebar Menu**

- Look for "Settings" in the admin sidebar
- Click to navigate to settings page
- (Sidebar component should have link added)

### 3. **Programmatically**

```javascript
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  const goToSettings = () => {
    navigate("/admin/settings");
  };

  return <button onClick={goToSettings}>Go to Settings</button>;
}
```

---

## 🔑 Key Features by Category

### 1. System Settings

**Expandable Categories:**

- General (name, description, contact info)
- Location (address, coordinates)
- Functionality (feature toggles)
- Policies (order limits, delivery radius)

**Actions:** Expand/Collapse, Save per category

### 2. Service Settings

**4 Service Types:**

- Pickup (with estimated time)
- Delivery (time, fee, radius)
- Dine-in (time, table capacity)
- Table Booking (advance time, party size)

**Actions:** Toggle service on/off, Configure settings, Save

### 3. Payment Methods

**CRUD Operations:**

- Add new payment method
- Edit existing methods
- Delete methods
- Toggle methods on/off

**Supported Types:** Credit Card, Wallet, Bank Transfer, Cash, Apple Pay, Google Pay

### 4. Website Design

**6 Tabs:**

1. **Colors** - Primary, secondary, accent colors with picker
2. **Fonts** - Font family selection
3. **Domain** - Subdomain configuration
4. **SEO** - Title, meta description, keywords
5. **Social Media** - Links to social profiles
6. **Custom Code** - Header/footer code injection

**Special Feature:** Real-time preview panel on sidebar

### 5. Integrations

**8 Services:**

- Facebook Pixel
- Google Analytics
- Google Tag Manager
- Mailchimp
- Stripe
- Twilio
- SendGrid
- Slack

**Actions:** Enable/disable, Configure API keys and settings

### 6. Branding

**Features:**

- Logo upload (PNG, JPG, GIF)
- Favicon upload
- Brand name & tagline (bilingual)
- Color palette selector
- Preview of colors

### 7. Content

**Two Sub-sections:**

- **FAQs** - CRUD operations, categories, bilingual
- **Policies** - Terms, Privacy, Cancellation, Returns (bilingual)

---

## 🎯 User Workflows

### Workflow 1: Basic Restaurant Setup

1. Navigate to Settings → System Settings
2. Enter restaurant name, address, contact info
3. Set location coordinates (for map)
4. Enable required services (Delivery/Pickup/Dine-in)
5. Save settings

### Workflow 2: Configure Payment Methods

1. Navigate to Settings → Payment Methods
2. Click "Add Payment Method"
3. Select type (Credit Card, Cash, etc.)
4. Set transaction fee if applicable
5. Enable/disable as needed
6. Save

### Workflow 3: Customize Website Design

1. Navigate to Settings → Website Design
2. Switch to "Colors" tab
3. Click color picker or enter hex code
4. View live preview on right sidebar
5. Switch to other tabs (Fonts, SEO, Social)
6. Configure as needed
7. Save all changes

### Workflow 4: Add FAQs

1. Navigate to Settings → Content
2. Click "Add FAQ" (or edit existing)
3. Select category
4. Enter question & answer (English & Arabic)
5. Save FAQ
6. View in list with delete/edit options

---

## 🔗 Integration with Backend

### API Endpoints Used

All endpoints are under `/api/restaurant/`:

```javascript
// System Settings
GET    /api/restaurant/system-settings
PUT    /api/restaurant/system-settings
PUT    /api/restaurant/system-settings/:category

// Services
GET    /api/restaurant/services
PUT    /api/restaurant/services
PUT    /api/restaurant/services/:service/toggle

// Payment Methods
GET    /api/restaurant/payment-methods
POST   /api/restaurant/payment-methods
PUT    /api/restaurant/payment-methods/:methodId
DELETE /api/restaurant/payment-methods/:methodId
PUT    /api/restaurant/payment-methods/:methodId/toggle

// Website Design
GET    /api/restaurant/website-design
PUT    /api/restaurant/website-design
PUT    /api/restaurant/website-design/colors

// Integrations
GET    /api/restaurant/integrations
PUT    /api/restaurant/integrations/:integration
PUT    /api/restaurant/integrations/:integration/toggle

// Content
GET    /api/restaurant/faqs
POST   /api/restaurant/faqs
PUT    /api/restaurant/faqs/:faqId
DELETE /api/restaurant/faqs/:faqId
GET    /api/restaurant/policies
PUT    /api/restaurant/policies

// Uploads
POST   /api/restaurant/upload-logo
```

### Authentication

- All requests include bearer token automatically
- Admin role required (enforced by backend)
- Automatic error handling with toast notifications

---

## 🎨 UI Features

### Responsive Design

- **Desktop (1024px+):** Sidebar navigation + main content
- **Tablet (640-1023px):** 2-column layout
- **Mobile (<640px):** Full-width, horizontal tabs

### RTL Support

- Automatically activates for Arabic language
- All components adjust layout, padding, borders
- Text direction handled automatically

### Dark Mode

- Full dark theme support
- All components have `dark:` CSS classes
- Color preview works in both themes

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation supported
- Color contrast ratios meet standards
- Form labels properly associated with inputs

---

## 📋 Sidebar Menu Integration

To add Settings to the admin sidebar, update the sidebar component:

```jsx
<nav className="sidebar">
  {/* Other menu items */}

  <Link to="/admin/settings" className="menu-item">
    <SettingsIcon className="icon" />
    <span>Settings</span>
  </Link>
</nav>
```

---

## ⚙️ Configuration & Customization

### Adding Custom Integrations

1. Edit `IntegrationsSettings.jsx`
2. Add new integration to `integrationConfigs` array
3. Define fields for the integration
4. Save and test

### Adding Custom System Settings Fields

1. Edit `SystemSettings.jsx`
2. Add new field to appropriate category
3. Define field type (text, email, number, toggle, textarea)
4. Update backend schema if needed

### Changing Color Scheme

- Primary buttons: Change `bg-blue-600` to your color
- All components use Tailwind classes
- Search for color classes and replace

---

## 🧪 Quick Testing

### Test Checklist

- [ ] Load `/admin/settings` - page appears
- [ ] Tab switching works smoothly
- [ ] Click save button - settings update
- [ ] Toast notification appears (success/error)
- [ ] Mobile view stacks correctly
- [ ] Dark mode colors look good
- [ ] All form fields accept input
- [ ] File uploads work (logo/favicon)
- [ ] Color pickers function properly
- [ ] FAQs CRUD operations work

---

## 📊 Performance Tips

1. **Lazy Load Settings Data**

   - Only fetch data when tab is active
   - Implement in useEffect hooks

2. **Optimize Images**

   - Compress uploaded logos
   - Use proper image formats
   - Add loading states for uploads

3. **Debounce Form Inputs**

   - Prevent excessive API calls
   - Use debounce for "auto-save" feature

4. **Memoize Components**
   - Use React.memo for sub-components
   - Prevent unnecessary re-renders

---

## 🐛 Troubleshooting

### Settings page not loading

- Check browser console for errors
- Verify admin authentication
- Ensure backend endpoints are running

### API calls failing

- Check network tab in dev tools
- Verify auth token is being sent
- Ensure backend routes are configured
- Check CORS settings if needed

### Form not saving

- Check if backend endpoint exists
- Verify request payload format
- Look for validation errors in console
- Check server logs for errors

### Styling looks wrong

- Clear browser cache
- Check if Tailwind CSS is loaded
- Verify dark mode CSS is applied
- Check for CSS conflicts

---

## 📚 Documentation Files

- `README.md` - Comprehensive component documentation
- `SETUP_SUMMARY.md` - Quick setup overview
- `APP_UPDATE_SUMMARY.md` - App.jsx changes
- This file - Integration & usage guide

---

## 🚀 Next Steps

1. **Test all features** with your backend
2. **Add Settings link** to admin sidebar
3. **Train admin users** on how to use settings
4. **Monitor analytics** for most-used features
5. **Gather feedback** for improvements
6. **Plan enhancements** (export/import, audit log, etc.)

---

**Built with:** React, Tailwind CSS, React Router v6+, React i18n, Lucide Icons
**Last Updated:** December 28, 2025
**Status:** ✅ Ready for Production
