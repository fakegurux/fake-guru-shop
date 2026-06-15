/* ============================================================
   FAKE GURU SHOP — backend
   Serves the shop + admin, stores products, handles image upload.
   Set your admin password via the ADMIN_PASSWORD env var.
   On first start it seeds data/products.json if it's missing
   (so it works even with an empty Coolify volume).
   ============================================================ */
const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-now';
const TOKEN = crypto.randomBytes(24).toString('hex'); // new each restart

const DATA_FILE  = path.join(__dirname, 'data', 'products.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---- seed data on first run (if file missing) ---- */
const SEED = {
  brand: { name:"FAKE GURU", logo:"", heroTitle:"YouTube ebooks that <span>deliver.</span>", heroSub:"Instant delivery after payment confirmation.", copyright:"© 2026 FAKE GURU. All rights reserved." },
  contact: { x:"https://x.com/FakeYTGuru1", discord:"fakegurux", supportUrl:"https://x.com/FakeYTGuru1" },
  pay: { paypal:"https://paypal.me/fakeguru1", wise:"https://wise.com/pay/me/mergimh24", binancePay:"", usdt:"", bnb:"", eth:"" },
  products: [
    { id:"yt1", title:"Youtube 1", img:"", price:9.99,  stock:null, badge:"Bestseller", short:"Your first YouTube ebook.",  desc:"Edit this in the admin panel." },
    { id:"yt2", title:"Youtube 2", img:"", price:12.99, stock:40,   badge:"",           short:"Your second YouTube ebook.", desc:"" },
    { id:"yt3", title:"Youtube 3", img:"", price:14.99, stock:25,   badge:"New",         short:"Your third YouTube ebook.",  desc:"" },
    { id:"yt4", title:"Youtube 4", img:"", price:17.99, stock:null, badge:"",           short:"Your fourth YouTube ebook.", desc:"" },
    { id:"yt5", title:"Youtube 5", img:"", price:19.99, stock:10,   badge:"",           short:"Your fifth YouTube ebook.",  desc:"" },
    { id:"yt6", title:"Youtube 6", img:"", price:24.99, stock:0,    badge:"-40%",        short:"Your sixth YouTube ebook.",  desc:"" }
  ]
};
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  console.log('Seeded data/products.json');
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---- image upload ---- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

/* ---- auth ---- */
function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (t !== TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.post('/api/login', (req, res) => {
  if (req.body && req.body.password === ADMIN_PASSWORD) return res.json({ token: TOKEN });
  return res.status(401).json({ error: 'wrong password' });
});

app.get('/api/data', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))); }
  catch { res.status(500).json({ error: 'no data' }); }
});

app.post('/api/data', auth, (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'write failed' }); }
});

app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.listen(PORT, () => console.log('FAKE GURU shop running on port ' + PORT));
