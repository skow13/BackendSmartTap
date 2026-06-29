require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { pool }   = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/devices',   require('./routes/devices'));
app.use('/api/alimentos', require('./routes/alimentos'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let db = false;
  try { await pool.query('SELECT 1'); db = true; } catch {}
  res.json({
    status: 'ok',
    db: db ? 'connected' : 'error',
    uptime: process.uptime().toFixed(1) + 's',
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));

app.listen(PORT, () => console.log(`[SERVER] SmartTap backend corriendo en puerto ${PORT}`));
