class Task {
  constructor(id, user_id, title, description, status, created_at) {
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.description = description;
    this.status = status || 'pending';
    this.created_at = created_at;
  }

  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return query;
  }
}

module.exports = Task;
