const router = require('express').Router();
const auth   = require('../middleware/auth');
const { callFn, pool } = require('../config/db');

router.use(auth);

// GET /api/alimentos — listar todos los alimentos del catálogo
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM alimentos ORDER BY nombre ASC'
    );
    res.json({ alimentos: rows });
  } catch (err) {
    console.error('[ALIMENTOS list]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/alimentos — registrar nuevo alimento en el catálogo
router.post('/', async (req, res) => {
  const { nombre, temp_optima_natural, temp_optima_congelado, humedad_optima_natural, humedad_optima_congelado } = req.body;
  if (!nombre)
    return res.status(400).json({ error: 'nombre es requerido' });

  try {
    await callFn('insertar_alimento', [
      nombre,
      temp_optima_natural    ?? null,
      temp_optima_congelado  ?? null,
      humedad_optima_natural ?? null,
      humedad_optima_congelado ?? null,
    ]);
    res.status(201).json({ message: 'Alimento registrado' });
  } catch (err) {
    console.error('[ALIMENTOS create]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/alimentos/taper/:mac — alimentos actuales en el taper
router.get('/taper/:mac', async (req, res) => {
  const { mac } = req.params;
  try {
    const rows = await callFn('obtener_alimentos_taper', [mac]);
    res.json({ mac, alimentos: rows });
  } catch (err) {
    console.error('[ALIMENTOS taper get]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/alimentos/taper/:mac — agregar alimento al taper
router.post('/taper/:mac', async (req, res) => {
  const { mac } = req.params;
  const { alimento_id } = req.body;
  if (!alimento_id)
    return res.status(400).json({ error: 'alimento_id es requerido' });

  try {
    await callFn('agregar_alimento_taper', [mac, parseInt(alimento_id)]);
    res.status(201).json({ message: 'Alimento agregado al taper' });
  } catch (err) {
    console.error('[ALIMENTOS taper add]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/alimentos/taper/:mac/:alimento_id — retirar alimento del taper
router.delete('/taper/:mac/:alimento_id', async (req, res) => {
  const { mac, alimento_id } = req.params;
  try {
    await callFn('retirar_alimento_taper', [mac, parseInt(alimento_id)]);
    res.json({ message: 'Alimento retirado del taper' });
  } catch (err) {
    console.error('[ALIMENTOS taper remove]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
