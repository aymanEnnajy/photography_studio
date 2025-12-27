# 📸 PhotoStudio Hub - Photography Studio Management Platform

## 🌟 Overview

**PhotoStudio Hub** is a professional, modern, and fully responsive web platform for managing and discovering photography studios. Built with a mobile-first approach, it features smooth 3D effects, animated transitions, and interactive elements for a dynamic user experience.

This project is a **Full-Stack Application** utilizing **Cloudflare Workers** (Hono framework) for the backend and **Cloudflare D1** (SQLite) for the database. The frontend interacts with this backend via a centralized API helper.

---

## ✨ Key Features

### 🎨 Design & UX
- ✅ **Mobile-First Responsive Design** - Perfect adaptation from 320px to 4K screens
- ✅ **3D Effects & Animations** - Parallax scrolling, card hover effects with 3D transforms, floating elements
- ✅ **Smooth Transitions** - Page transitions, scroll-triggered animations, micro-interactions
- ✅ **Modern UI/UX** - Clean layouts, elegant typography, professional color scheme
- ✅ **Accessibility** - ARIA labels, keyboard navigation, focus indicators
- ✅ **Fast Loading** - Optimized assets, efficient CSS, minimal dependencies

### 🏗️ Pages & Functionality

#### 1. **Homepage (index.html)**
- Hero section with animated photography elements
- Featured studios showcase
- Features section highlighting platform benefits
- Call-to-action sections
- Statistics display (150+ studios, 50+ cities, 2500+ bookings)

#### 2. **Studios Listing (studios.html)**
- Grid/card layout with 6 studios per page
- Advanced filtering system:
  - Search by name
  - Filter by services (Marriage, Portrait, Commercial)
  - Filter by status (Available/Reserved)
  - Filter by city
  - Filter by equipment
  - Price range slider (0-300€)
- Sorting options (newest, price, rating, name)
- Pagination with page numbers
- Responsive sidebar filters (mobile drawer)
- View toggle (grid/list)

#### 3. **Studio Detail (studio-detail.html)**
- Full studio information display
- Image gallery with thumbnails
- Services and equipment lists
- Studio features (surface, height, capacity, parking)
- Favorite button (heart icon)
- Booking button
- Similar studios section
- Edit/Delete buttons (for studio owners)

#### 4. **Authentication**
- **Login Page (login.html)**
  - Email/password form
  - Remember me checkbox
  - Password visibility toggle
  - Social login buttons (Google, Facebook)
  - Forgot password link
  - Responsive design with illustration

- **Register Page (register.html)**
  - Username, email, password fields
  - Password confirmation
  - Password strength indicator (Weak/Medium/Strong)
  - Terms & conditions checkbox
  - Social registration options
  - Real-time form validation

#### 5. **Favorites (favorites.html)**
- Display all user's favorite studios
- Quick remove from favorites
- Clear all favorites option
- Auth required message for non-logged users
- Empty state with call-to-action

#### 6. **Add/Edit Studio (add-studio.html)**
- Complete CRUD form:
  - Studio name, city, price, status
  - Services selection (checkboxes)
  - Equipment selection (checkboxes)
  - Description textarea
  - Image URL input
- Real-time preview card
- Form validation
- Edit mode (pre-filled form)
- Responsive form layout

---

## 🎯 Studio Entity Attributes

Each studio includes:
- **Name** - Studio name
- **Services** - Marriage, Portrait, Commercial (with icons)
- **Price** - Hourly rate (€)
- **City** - Location in France
- **Equipment** - List of available equipment
- **Status** - Available or Reserved (with badge)
- **Image** - Studio photo
- **Rating** - User ratings (0-5 stars)
- **Description** - Detailed studio description
- **Features** - Surface, height, capacity, parking

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with:
  - CSS Grid & Flexbox
  - CSS Variables (Custom Properties)
  - Animations & Transforms
  - Media Queries for responsiveness
- **Vanilla JavaScript** - No frameworks, pure JS for:
  - State management
  - DOM manipulation
  - Event handling
  - Local storage management
  - Form validation

### External Libraries (CDN)
- **Google Fonts** - Inter & Playfair Display
- **Font Awesome 6.4.0** - Icons

### No Backend (Demo Only)
- All data is stored in `localStorage`
- API calls are simulated with `setTimeout`
- No real authentication (mock JWT tokens)

---

## 📁 Project Structure

```
photostudio-hub/
│
├── index.html              # Homepage
├── studios.html            # Studios listing with filters
├── studio-detail.html      # Individual studio details
├── login.html              # Login page
├── register.html           # Registration page
├── favorites.html          # User's favorite studios
├── add-studio.html         # Add/Edit studio form
│
├── css/
│   └── style.css           # Main stylesheet (~20KB)
│
├── js/
│   ├── main.js             # Core functionality, state management
│   ├── studios.js          # Studios listing, filtering, pagination
│   ├── studio-detail.js    # Studio detail page logic
│   ├── auth.js             # Login/register functionality
│   ├── favorites.js        # Favorites page logic
│   └── add-studio.js       # Add/Edit studio form logic
│
└── README.md               # This file
```

---

## 🚀 Getting Started

### Installation

1. **Clone or download** the project files
2. **Open `index.html`** in a web browser
3. **No build process required** - it's a static site!

### Usage

#### For Users:
1. **Browse Studios** - Visit `studios.html` to see all available studios
2. **Filter & Search** - Use the sidebar to filter by services, price, city, equipment
3. **View Details** - Click on any studio to see full details
4. **Register/Login** - Create an account to access favorite features
5. **Add Favorites** - Click the heart icon to save studios
6. **View Favorites** - Go to `favorites.html` to see all saved studios

#### For Studio Owners:
1. **Login** - Use the authentication system
2. **Add Studio** - Go to `add-studio.html` and fill in the form
3. **Edit Studio** - Click "Edit" on your studio's detail page
4. **Delete Studio** - Click "Delete" on your studio's detail page

---

## 💾 Data Storage

Since this is a frontend-only demo, all data is stored in `localStorage`:

```javascript
localStorage.setItem('user', JSON.stringify(userData));
localStorage.setItem('token', jwtToken);
localStorage.setItem('favorites', JSON.stringify(favoriteIds));
```

### Mock Data
The project includes mock data for 6 studios:
1. Studio Lumière Pro (Paris) - 80€/h
2. Atelier Créatif 360 (Lyon) - 120€/h
3. Studio Élégance (Marseille) - 95€/h
4. Photo Vision Studio (Toulouse) - 70€/h
5. Studio Premium Plus (Nice) - 150€/h
6. Capture Studio (Nantes) - 85€/h

---

## 🎨 Design Features

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Accent**: #f59e0b (Amber)
- **Success**: #10b981 (Green)
- **Danger**: #ef4444 (Red)
- **Dark**: #0f172a (Slate)
- **Light**: #f1f5f9 (Slate)

### Typography
- **Display Font**: Playfair Display (headings, titles)
- **Body Font**: Inter (paragraphs, UI elements)

### Animations
- Fade in/up/left/right animations
- 3D card transforms on hover
- Floating elements with parallax
- Smooth scroll effects
- Loading skeletons
- Button ripple effects
- Heart beat animation for favorites

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
Default: 320px - 639px (mobile)
640px+: Small tablets
768px+: Tablets
1024px+: Laptops/desktops
1280px+: Large desktops
```

---

## 🔐 Authentication Flow (Mock)

### Registration
1. User fills in: username, email, password
2. Password strength validation
3. Terms acceptance required
4. Creates mock user account
5. Saves to localStorage
6. Redirects to homepage

### Login
1. User enters: email, password
2. Mock validation (any email + password ≥ 6 chars)
3. Creates mock JWT token
4. Saves to localStorage
5. Updates UI (shows profile, hides login buttons)
6. Redirects to homepage

### Logout
1. Clears all localStorage data
2. Resets app state
3. Updates UI
4. Redirects to homepage

---

## ⭐ Features Implementation Status

### ✅ Completed Features
- [x] Responsive navigation with mobile menu
- [x] Hero section with animations
- [x] Studios listing with filtering
- [x] Pagination (6 items per page)
- [x] Studio detail page
- [x] Authentication (Login/Register)
- [x] Favorites system
- [x] Add/Edit studio form
- [x] Real-time form preview
- [x] Password strength indicator
- [x] Scroll to top button
- [x] Toast notifications
- [x] Loading screens
- [x] Form validation
- [x] Responsive design (mobile-first)
- [x] 3D hover effects
- [x] Smooth animations
- [x] Accessibility features

### 🚧 Not Implemented (Out of Scope for Frontend Demo)
- [ ] Backend API integration
- [ ] Real database connection
- [ ] Real authentication with JWT
- [ ] File upload for images
- [ ] Payment integration
- [ ] Email notifications
- [ ] Real-time availability
- [ ] Booking system
- [ ] Admin dashboard
- [ ] User profiles with photos
- [ ] Reviews & ratings system
- [ ] Search autocomplete
- [ ] Map integration
- [ ] Multi-language support

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+
- ⚠️ IE11 (not supported)

---

## 🔮 Future Enhancements (Backend Integration)

When integrating with a real backend:

1. **API Endpoints** (from requirements):
   ```
   POST /api/auth/register
   POST /api/auth/login
   GET  /api/auth/me
   
   GET    /api/items (studios)
   GET    /api/items/:id
   POST   /api/items (auth required)
   PUT    /api/items/:id (auth required)
   DELETE /api/items/:id (auth required)
   
   POST   /api/favorites/:itemId
   DELETE /api/favorites/:itemId
   GET    /api/favorites/my-favorites
   ```

2. **Database Schema** (from requirements):
   - **users** table: id, username, email, password_hash, created_at
   - **items (studios)** table: id, user_id, name, services, price, city, equipment, status, image, created_at
   - **favorites** table: id, user_id, item_id, created_at

3. **Additional Features**:
   - Real image upload (Cloudinary, AWS S3)
   - Email verification
   - Password reset
   - User profiles
   - Booking calendar
   - Reviews & ratings
   - Admin panel
   - Analytics dashboard

---

## 📝 Notes

### For Backend Developers
This frontend is **ready for API integration**. Simply:
1. Replace mock data with real API calls
2. Update `fetch()` calls in JS files
3. Handle authentication tokens properly
4. Implement proper error handling
5. Add loading states

### For Designers
The CSS is well-organized with:
- CSS Variables for easy theming
- Consistent spacing and sizing
- Reusable component classes
- Clear naming conventions
- Responsive mixins

---

## 📄 License

This is a demonstration project created for educational purposes.

---

## 👨‍💻 Developer

**Ayman's Project**
- Project: Photography Studio Management System
- Deadline: Sunday at 12AM
- Status: ✅ Frontend Complete

---

## 📞 Contact & Support

For questions or issues with this frontend demo, please refer to the code comments or check the browser console for debugging information.

---

## 🎉 Acknowledgments

- Google Fonts for typography
- Font Awesome for icons
- Inspired by modern SaaS platforms and photography websites

---

**Enjoy exploring PhotoStudio Hub! 📸✨**
