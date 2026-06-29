const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { callFn, pool } = require('../config/db');

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'nombre, email y password son requeridos' });

  try {
    const hash   = await bcrypt.hash(password, 10);
    const [user] = await callFn('registrar_usuario', [nombre, email, hash]);

    res.status(201).json({
      token: makeToken(user),
      user:  { id: user.id, nombre: user.nombre, email: user.email },
    });
  } catch (err) {
    if (err.message.includes('EMAIL_DUPLICADO'))
      return res.status(409).json({ error: 'El email ya está registrado' });
    console.error('[AUTH register]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email y password son requeridos' });

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    res.json({
      token: makeToken(user),
      user:  { id: user.id, nombre: user.nombre, email: user.email },
    });
  } catch (err) {
    console.error('[AUTH login]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
