const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'taskflow_user',
  password: process.env.DB_PASSWORD || 'taskflow_pass',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskflow_db',
});

// ==================== CREAR TAREA ====================
const createTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const user_id = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, description, status || 'pending']
    );

    res.status(201).json({
      message: 'Tarea creada con éxito',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
};

// ==================== OBTENER TODAS LAS TAREAS ====================
const getTasks = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );

    res.json({
      tasks: result.rows
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error al obtener las tareas' });
  }
};

// ==================== OBTENER UNA TAREA ====================
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

// ==================== ACTUALIZAR TAREA ====================
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const user_id = req.user.id;

    // Verificar que la tarea existe y pertenece al usuario
    const checkResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Construir la consulta de actualización dinámicamente
    let query = 'UPDATE tasks SET ';
    const values = [];
    let counter = 1;

    if (title !== undefined) {
      query += `title = $${counter}, `;
      values.push(title);
      counter++;
    }

    if (description !== undefined) {
      query += `description = $${counter}, `;
      values.push(description);
      counter++;
    }

    if (status !== undefined) {
      query += `status = $${counter}, `;
      values.push(status);
      counter++;
    }

    // Eliminar la última coma y espacio
    query = query.slice(0, -2);

    query += ` WHERE id = $${counter} AND user_id = $${counter + 1} RETURNING *`;
    values.push(id, user_id);

    const result = await pool.query(query, values);

    res.json({
      message: 'Tarea actualizada con éxito',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
};

// ==================== ELIMINAR TAREA ====================
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({
      message: 'Tarea eliminada con éxito',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
