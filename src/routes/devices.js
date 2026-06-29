const router = require('express').Router();
const auth   = require('../middleware/auth');
const { callFn, pool } = require('../config/db');

router.use(auth);

// POST /api/devices/register  — vincular ESP32 por MAC
router.post('/register', async (req, res) => {
  const { mac, nombre } = req.body;
  if (!mac)
    return res.status(400).json({ error: 'mac es requerido' });

  try {
    const [device] = await callFn('registrar_dispositivo', [
      mac, req.user.userId, nombre || 'Mi Taper'
    ]);
    res.status(201).json({ device });
  } catch (err) {
    if (err.message.includes('USUARIO_NO_ENCONTRADO'))
      return res.status(404).json({ error: 'Usuario no encontrado' });
    console.error('[DEVICES register]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/devices — listar dispositivos del usuario con última lectura
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        d.mac,
        d.nombre,
        d.registrado_at,
        m.temperatura,
        m.humedad,
        m.bateria_pct,
        m.modo,
        m.registrado_at AS ultima_lectura
      FROM dispositivos d
      LEFT JOIN LATERAL (
        SELECT * FROM medidas
        WHERE mac = d.mac
        ORDER BY registrado_at DESC
        LIMIT 1
      ) m ON true
      WHERE d.user_id = $1
      ORDER BY d.registrado_at DESC
    `, [req.user.userId]);

    res.json({ devices: rows });
  } catch (err) {
    console.error('[DEVICES list]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/devices/:mac/history/temperatura — últimas 20 medidas de temperatura
router.get('/:mac/history/temperatura', async (req, res) => {
  const { mac } = req.params;
  try {
    await verificarPropiedad(mac, req.user.userId, res);
    const rows = await callFn('obtener_mediciones_temperatura', [mac]);
    res.json({ mac, history: rows });
  } catch (err) {
    if (err._handled) return;
    console.error('[DEVICES history temp]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/devices/:mac/history/humedad — últimas 20 medidas de humedad
router.get('/:mac/history/humedad', async (req, res) => {
  const { mac } = req.params;
  try {
    await verificarPropiedad(mac, req.user.userId, res);
    const rows = await callFn('obtener_mediciones_humedad', [mac]);
    res.json({ mac, history: rows });
  } catch (err) {
    if (err._handled) return;
    console.error('[DEVICES history hum]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/devices/:mac/history — historial general (mantiene compatibilidad)
router.get('/:mac/history', async (req, res) => {
  const { mac } = req.params;
  const limite  = Math.min(parseInt(req.query.limite) || 50, 500);

  try {
    await verificarPropiedad(mac, req.user.userId, res);
    const rows = await callFn('obtener_medidas', [mac, limite]);
    res.json({ mac, history: rows });
  } catch (err) {
    if (err._handled) return;
    console.error('[DEVICES history]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/devices/:mac/data — datos enviados por la app desde BLE
router.post('/:mac/data', async (req, res) => {
  const { mac } = req.params;
  const { temperatura, humedad, bateria_pct } = req.body;

  if (temperatura == null || humedad == null)
    return res.status(400).json({ error: 'temperatura y humedad son requeridos' });

  try {
    await verificarPropiedad(mac, req.user.userId, res);
    const [medida] = await callFn('registrar_medida', [
      mac,
      parseFloat(temperatura),
      parseFloat(humedad),
      'ble',
      bateria_pct != null ? parseInt(bateria_pct) : null,
    ]);
    res.status(201).json({ medida });
  } catch (err) {
    if (err._handled) return;
    if (err.message.includes('DISPOSITIVO_NO_ENCONTRADO'))
      return res.status(404).json({ error: 'Dispositivo no registrado. Vincúlalo primero desde la app.' });
    console.error('[DEVICES data]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/devices/:mac
router.delete('/:mac', async (req, res) => {
  const { mac } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM dispositivos WHERE mac = $1 AND user_id = $2',
      [mac, req.user.userId]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    res.json({ message: 'Dispositivo eliminado' });
  } catch (err) {
    console.error('[DEVICES delete]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── Helper ────────────────────────────────────────────────────────────────────
async function verificarPropiedad(mac, userId, res) {
  const { rows } = await pool.query(
    'SELECT 1 FROM dispositivos WHERE mac = $1 AND user_id = $2',
    [mac, userId]
  );
  if (!rows.length) {
    const err = new Error('No autorizado');
    err._handled = true;
    res.status(403).json({ error: 'Dispositivo no encontrado o no autorizado' });
    throw err;
  }
}

module.exports = router;
