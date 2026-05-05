const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

// Ensure data file exists
fs.ensureFileSync(DATA_FILE);
if (!fs.readFileSync(DATA_FILE, 'utf8').trim()) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'event_stream_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Helper functions
function getEvents() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch { return []; }
}

function saveEvents(events) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

function getEventById(id) {
  return getEvents().find(e => e.id === id);
}

function authMiddleware(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Home redirect
app.get('/', (req, res) => res.redirect('/admin/login'));

// ── Admin Login
app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'event@2026') {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: 'Invalid credentials. Please try again.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ── Admin Dashboard
app.get('/admin/dashboard', authMiddleware, (req, res) => {
  const events = getEvents();
  res.render('admin/dashboard', { events });
});

// ── Create Event
app.get('/admin/events/new', authMiddleware, (req, res) => {
  res.render('admin/event-form', { event: null, error: null });
});

app.post('/admin/events/create', authMiddleware, async (req, res) => {
  try {
    const {
      title, ceremonyType, eventDate, eventTime,
      location, mapsEmbed, youtubeUrl, rtmpUrl, streamKey, accessCode
    } = req.body;

    if (!title || !ceremonyType || !eventDate || !youtubeUrl || !accessCode) {
      return res.render('admin/event-form', {
        event: req.body, error: 'Please fill all required fields.'
      });
    }

    if (accessCode.length !== 4 || !/^\d{4}$/.test(accessCode)) {
      return res.render('admin/event-form', {
        event: req.body, error: 'Access code must be exactly 4 digits.'
      });
    }

    const id = uuidv4();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 8);
    
    // Generate QR code
    const publicUrl = `${req.protocol}://${req.get('host')}/event/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(youtubeUrl || publicUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    const event = {
      id, slug, title, ceremonyType, eventDate, eventTime,
      location, mapsEmbed: mapsEmbed || null,
      youtubeUrl, rtmpUrl: rtmpUrl || null,
      streamKey: streamKey || null,
      accessCode, qrCode: qrDataUrl,
      createdAt: new Date().toISOString()
    };

    const events = getEvents();
    events.push(event);
    saveEvents(events);

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.render('admin/event-form', { event: req.body, error: 'Server error. Try again.' });
  }
});

// ── Edit Event
app.get('/admin/events/:id/edit', authMiddleware, (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) return res.redirect('/admin/dashboard');
  res.render('admin/event-form', { event, error: null });
});

app.post('/admin/events/:id/update', authMiddleware, async (req, res) => {
  try {
    const events = getEvents();
    const idx = events.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.redirect('/admin/dashboard');

    const {
      title, ceremonyType, eventDate, eventTime,
      location, mapsEmbed, youtubeUrl, rtmpUrl, streamKey, accessCode
    } = req.body;

    if (accessCode.length !== 4 || !/^\d{4}$/.test(accessCode)) {
      return res.render('admin/event-form', {
        event: { ...events[idx], ...req.body }, error: 'Access code must be exactly 4 digits.'
      });
    }

    const qrDataUrl = await QRCode.toDataURL(youtubeUrl || '', {
      width: 200, margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    events[idx] = {
      ...events[idx], title, ceremonyType, eventDate, eventTime,
      location, mapsEmbed: mapsEmbed || null,
      youtubeUrl, rtmpUrl: rtmpUrl || null,
      streamKey: streamKey || null,
      accessCode, qrCode: qrDataUrl
    };

    saveEvents(events);
    res.redirect('/admin/dashboard');
  } catch (err) {
    res.redirect('/admin/dashboard');
  }
});

// ── Delete Event
app.post('/admin/events/:id/delete', authMiddleware, (req, res) => {
  const events = getEvents().filter(e => e.id !== req.params.id);
  saveEvents(events);
  res.redirect('/admin/dashboard');
});

// ── API: Verify Access Code
app.post('/api/verify-code', (req, res) => {
  const { slug, code } = req.body;
  const event = getEvents().find(e => e.slug === slug);
  if (!event) return res.json({ success: false, message: 'Event not found' });
  if (event.accessCode === code) {
    return res.json({
      success: true,
      rtmpUrl: event.rtmpUrl || 'Not configured',
      streamKey: event.streamKey || 'Not configured'
    });
  }
  res.json({ success: false, message: 'Invalid access code' });
});

// ── Public Event Page
app.get('/event/:slug', (req, res) => {
  const event = getEvents().find(e => e.slug === req.params.slug);
  if (!event) return res.status(404).render('404');
  res.render('event/public', { event });
});

// 404
app.use((req, res) => res.status(404).render('404'));

app.listen(PORT, () => {
  console.log(`\n🎬 Event Livestream Manager running at http://localhost:${PORT}\n`);
});
