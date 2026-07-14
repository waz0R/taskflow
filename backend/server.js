const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const auth = require('./src/middleware/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  user: 'taskflow_user',
  password: 'taskflow_pass',
  host: 'localhost',
  port: 5432,
  database: 'taskflow_db',
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('TaskFlow API is running!');
});

app.get('/setup', async (req, res) => {
  try {
    const createTableQuery = await User.createTable();
    await pool.query(createTableQuery);
    res.json({ message: 'Tabla de usuarios creada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la tabla' });
  }
});

app.use('/api/protected', auth);

app.get('/api/protected/profile', (req, res) => {
  res.json({
    message: 'Ruta protegida accedida con éxito',
    user: req.user
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
