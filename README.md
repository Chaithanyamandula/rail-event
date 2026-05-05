# EventStream — YouTube Live Event Management Platform

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ installed
- npm (comes with Node.js)

### Installation

```bash
# 1. Extract this zip and enter the folder
cd livestream-app

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# Or with auto-reload during development
npm run dev
```

The app will be running at **http://localhost:3000**

---

## 🔐 Admin Login

- **URL**: http://localhost:3000/admin/login
- **Username**: `admin`
- **Password**: `event@2026`

---

## 📁 Project Structure

```
livestream-app/
├── server.js              # Express server + all routes
├── package.json
├── data/
│   └── events.json        # Auto-created event data store
├── views/
│   ├── admin/
│   │   ├── login.ejs      # Admin login page
│   │   ├── dashboard.ejs  # Event management dashboard
│   │   └── event-form.ejs # Create/Edit event form
│   ├── event/
│   │   └── public.ejs     # Public event streaming page
│   └── 404.ejs
└── public/
    └── css/
        ├── main.css        # CSS variables, themes, reset
        ├── login.css       # Login page styles
        ├── admin.css       # Dashboard + form styles
        └── event.css       # Public event page + ceremony themes
```

---

## ✨ Features

### Admin
- Secure login (session-based)
- Create, edit, delete live events
- Ceremony types: Wedding, Reception, Sangeeth, Birthday
- Auto-generated unique public URLs
- QR code generation for YouTube Live links

### Public Event Page
- Embedded YouTube Live player
- Ceremony-specific themed UI (Indian cultural aesthetics)
- Event date, time, location display
- Google Maps embed support
- QR code for easy sharing

### Stream Credential Security
- 4-digit access code protection
- RTMP URL and Stream Key only shown after code verification
- Copy-to-clipboard modal popup

### Dynamic Theme
- **Light Mode**: 6 AM – 5 PM (IST)
- **Dark Mode**: 5 PM – 6 AM (IST)
- Applies to both admin and public pages

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/login` | Login page |
| POST | `/admin/login` | Authenticate |
| GET | `/admin/dashboard` | Event list |
| GET | `/admin/events/new` | Create form |
| POST | `/admin/events/create` | Save new event |
| GET | `/admin/events/:id/edit` | Edit form |
| POST | `/admin/events/:id/update` | Update event |
| POST | `/admin/events/:id/delete` | Delete event |
| POST | `/api/verify-code` | Verify 4-digit access code (JSON) |
| GET | `/event/:slug` | Public event page |

---

## 🎨 Ceremony Themes

| Type | Primary Color | Accent |
|------|--------------|--------|
| Wedding | Deep Red (`#8B1A1A`) | Gold (`#D4AF37`) |
| Reception | Navy Blue (`#1a3a5c`) | Champagne (`#C0A070`) |
| Sangeeth | Royal Purple (`#5c1a6e`) | Amber (`#F0A030`) |
| Birthday | Forest Green (`#1a5c2a`) | Yellow (`#F0C030`) |

---

## 🔧 Deployment

For production, set environment variables:
```bash
PORT=3000 node server.js
```

For HTTPS deployment (recommended for sharing stream keys), use a reverse proxy like nginx or deploy to:
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **Heroku**: `git push heroku main`
