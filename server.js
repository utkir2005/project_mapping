import express from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env loader (dotenv paketsiz)
if (existsSync(join(__dirname, '.env'))) {
  readFileSync(join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  });
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET     = process.env.JWT_SECRET     || 'o\'zgartiring-bu-kalitni';
const PORT           = parseInt(process.env.PORT  || '3001');
const MAX_HISTORY    = 50;
const MIN_INTERVAL   = 60 * 1000;

// Railway volumeda saqlash uchun: DATA_DIR=/data
// Localda: loyiha papkasida
const DATA_DIR = process.env.DATA_DIR || __dirname;

const DATA_FILE     = join(DATA_DIR, 'data.json');
const HISTORY_FILE  = join(DATA_DIR, 'history.json');
const USERS_FILE    = join(DATA_DIR, 'users.json');
const COMMENTS_FILE = join(DATA_DIR, 'comments.json');

const app = express();
app.use(express.json({ limit: '500mb' }));

// ─── Yordamchi funksiyalar ──────────────────────────────────────────

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch { return fallback; }
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function autoSnapshot(data) {
  const history = readJson(HISTORY_FILE, []);
  const now = Date.now(), last = history[0];
  if (last && (now - new Date(last.timestamp).getTime()) < MIN_INTERVAL) {
    history[0] = { ...last, timestamp: new Date(now).toISOString(), data };
  } else {
    history.unshift({ id: 'h_' + now, timestamp: new Date(now).toISOString(), data });
  }
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  writeJson(HISTORY_FILE, history);
}

// ─── Auth middleware ────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token talab qilinadi' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz yoki muddati o\'tgan' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Faqat admin uchun' });
  next();
}

// ─── Autentifikatsiya ───────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Admin kirishi
  if (username === 'admin' && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 'admin', name: 'Admin', role: 'admin', projects: [] },
      JWT_SECRET, { expiresIn: '30d' }
    );
    return res.json({ token, user: { id: 'admin', name: 'Admin', role: 'admin' } });
  }

  // Oddiy foydalanuvchi
  const users = readJson(USERS_FILE, []);
  const user  = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role, projects: user.projects || [] },
    JWT_SECRET, { expiresIn: '30d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

app.get('/api/auth/me', auth, (req, res) => res.json(req.user));

// ─── Ma'lumotlar ────────────────────────────────────────────────────

app.get('/api/data', auth, (req, res) => {
  const raw = readJson(DATA_FILE, { projects: [], steps: [] });
  if (req.user.role === 'admin') return res.json(raw);

  // Faqat ruxsat etilgan loyihalar
  const allowed    = new Set(req.user.projects || []);
  const projects   = (raw.projects || []).filter(p => allowed.has(p.id));
  const projectIds = new Set(projects.map(p => p.id));
  const steps      = (raw.steps    || []).filter(s => projectIds.has(s.projectId));
  res.json({ projects, steps });
});

app.post('/api/data', auth, adminOnly, (req, res) => {
  try {
    writeJson(DATA_FILE, req.body);
    autoSnapshot(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Foydalanuvchilar (faqat admin) ────────────────────────────────

app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = readJson(USERS_FILE, []);
  res.json(users.map(({ password, ...u }) => u));
});

app.post('/api/users', auth, adminOnly, (req, res) => {
  const users = readJson(USERS_FILE, []);
  if (users.find(u => u.username === req.body.username)) {
    return res.status(400).json({ error: 'Bu login allaqachon mavjud' });
  }
  const user = {
    id:       'u_' + Date.now(),
    name:     req.body.name     || '',
    username: req.body.username || '',
    password: req.body.password || '',
    role:     req.body.role     || 'viewer',
    projects: req.body.projects || [],
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  const { password, ...safe } = user;
  res.json(safe);
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const users = readJson(USERS_FILE, []);
  const idx   = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Topilmadi' });
  // Parol bo'sh yuborilsa — o'zgartirmaymiz
  const updated = { ...users[idx], ...req.body, id: req.params.id };
  if (!req.body.password) updated.password = users[idx].password;
  users[idx] = updated;
  writeJson(USERS_FILE, users);
  const { password, ...safe } = updated;
  res.json(safe);
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  const users = readJson(USERS_FILE, []);
  writeJson(USERS_FILE, users.filter(u => u.id !== req.params.id));
  res.json({ ok: true });
});

// ─── Kommentlar ─────────────────────────────────────────────────────

app.get('/api/comments/:projectId/:stepId', auth, (req, res) => {
  const { projectId, stepId } = req.params;
  if (req.user.role !== 'admin' && !req.user.projects.includes(projectId)) {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  const all = readJson(COMMENTS_FILE, []);
  res.json(all.filter(c => c.projectId === projectId && c.stepId === stepId));
});

app.post('/api/comments/:projectId/:stepId', auth, (req, res) => {
  const { projectId, stepId } = req.params;
  const hasAccess = req.user.role === 'admin' ||
    (req.user.projects.includes(projectId) && req.user.role === 'commenter');
  if (!hasAccess) return res.status(403).json({ error: 'Ruxsat yo\'q' });

  const all = readJson(COMMENTS_FILE, []);
  const comment = {
    id:         'c_' + Date.now(),
    projectId, stepId,
    authorId:   req.user.id,
    authorName: req.user.name,
    text:       req.body.text || '',
    createdAt:  new Date().toISOString(),
  };
  all.push(comment);
  writeJson(COMMENTS_FILE, all);
  res.json(comment);
});

app.delete('/api/comments/:id', auth, (req, res) => {
  const all     = readJson(COMMENTS_FILE, []);
  const comment = all.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Topilmadi' });
  if (req.user.role !== 'admin' && comment.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  writeJson(COMMENTS_FILE, all.filter(c => c.id !== req.params.id));
  res.json({ ok: true });
});

// ─── Tarix (faqat admin) ────────────────────────────────────────────

app.get('/api/history', auth, adminOnly, (req, res) => {
  const h = readJson(HISTORY_FILE, []);
  res.json(h.map(({ id, timestamp }) => ({ id, timestamp })));
});

app.get('/api/history/:id', auth, adminOnly, (req, res) => {
  const h = readJson(HISTORY_FILE, []);
  const e = h.find(x => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: 'Topilmadi' });
  res.json(e);
});

// ─── Production: React build fayllarini uzatish ────────────────────

const DIST  = join(__dirname, 'dist');
const INDEX = join(DIST, 'index.html');

console.log('App dir  :', __dirname);
console.log('Dist dir :', DIST);
console.log('Dist bor :', existsSync(DIST));
console.log('Index bor:', existsSync(INDEX));

app.use(express.static(DIST));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  if (existsSync(INDEX)) {
    res.sendFile(INDEX);
  } else {
    res.status(200).send(`<h2>dist/ papkasi topilmadi</h2><p>App dir: ${__dirname}</p><p>Dist: ${DIST}</p><p>Mavjud: ${existsSync(DIST)}</p>`);
  }
});

// ─── Ishga tushirish ────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log(`✓ Server          : http://localhost:${PORT}`);
  console.log(`✓ Admin login     : admin / ${ADMIN_PASSWORD}`);
  console.log(`✓ Ma'lumotlar     : data.json`);
  console.log(`✓ Foydalanuvchilar: users.json`);
  console.log('');
});
