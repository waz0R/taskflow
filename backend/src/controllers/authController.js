const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'taskflow_user',
  password: process.env.DB_PASSWORD || 'taskflow_pass',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskflow_db',
});

// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    console.log('Verificando si el usuario existe...');
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    console.log('Hash de contraseña...');
    const hashedPassword = await User.hashPassword(password);

    console.log('Insertando usuario...');
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    res.status(201).json({
      message: 'Usuario creado con éxito',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    console.log('Login - Datos recibidos:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    console.log('Buscando usuario...');
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    console.log('Verificando contraseña...');
    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('Generando token...');
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'taskflow_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { register, login };
