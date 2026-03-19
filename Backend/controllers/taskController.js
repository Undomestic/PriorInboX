const pool = require('../config/database');

// Get all tasks for a user (with optional filtering)
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, sortBy } = req.query;
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.user.id];

    // Filter by status
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filter by priority
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    // Sort
    if (sortBy === 'due_date') {
      query += ' ORDER BY due_date ASC, created_at DESC';
    } else if (sortBy === 'priority') {
      query += ' ORDER BY FIELD(priority, "high", "medium", "low"), created_at DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const conn = await pool.getConnection();
    const [tasks] = await conn.query(query, params);
    conn.release();
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active tasks (for dashboard)
exports.getActiveTasks = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [tasks] = await conn.query(
      'SELECT * FROM tasks WHERE user_id = ? AND status != "completed" ORDER BY priority DESC, due_date ASC LIMIT 10',
      [req.user.id]
    );
    conn.release();
    
    res.json(tasks);
  } catch (error) {
    console.error('Get active tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const conn = await pool.getConnection();
    
    const [result] = await conn.query(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, status || 'pending', priority || 'medium', due_date || null]
    );

    conn.release();

    res.status(201).json({ 
      message: 'Task created successfully',
      taskId: result.insertId 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    const conn = await pool.getConnection();
    
    // Verify task belongs to user
    const [tasks] = await conn.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (tasks.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Task not found' });
    }

    await conn.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = NOW() WHERE id = ?',
      [title, description, status, priority, due_date, id]
    );

    conn.release();

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark task as completed (used for animation)
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await pool.getConnection();
    
    const [tasks] = await conn.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (tasks.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Task not found' });
    }

    await conn.query(
      'UPDATE tasks SET status = "completed", updated_at = NOW() WHERE id = ?',
      [id]
    );

    conn.release();

    res.json({ message: 'Task completed successfully' });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await pool.getConnection();
    
    // Verify task belongs to user
    const [tasks] = await conn.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (tasks.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Task not found' });
    }

    await conn.query('DELETE FROM tasks WHERE id = ?', [id]);

    conn.release();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
