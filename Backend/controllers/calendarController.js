const pool = require('../config/database');

// Get all calendar events for a user
exports.getEvents = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [events] = await conn.query(
      'SELECT id, user_id, title, description, DATE_FORMAT(event_date, "%Y-%m-%d") as event_date, event_time, location FROM calendar_events WHERE user_id = ? ORDER BY event_date DESC',
      [req.user.id]
    );
    conn.release();
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a calendar event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, event_date, event_time, location } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ message: 'Title and event date are required' });
    }

    const conn = await pool.getConnection();
    
    const [result] = await conn.query(
      'INSERT INTO calendar_events (user_id, title, description, event_date, event_time, location) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, event_date, event_time || null, location || null]
    );

    conn.release();

    res.status(201).json({ 
      message: 'Event created successfully',
      eventId: result.insertId 
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a calendar event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, location } = req.body;

    const conn = await pool.getConnection();
    
    // Verify event belongs to user
    const [events] = await conn.query('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (events.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Event not found' });
    }

    await conn.query(
      'UPDATE calendar_events SET title = ?, description = ?, event_date = ?, event_time = ?, location = ? WHERE id = ?',
      [title, description, event_date, event_time, location, id]
    );

    conn.release();

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a calendar event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await pool.getConnection();
    
    // Verify event belongs to user
    const [events] = await conn.query('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    if (events.length === 0) {
      conn.release();
      return res.status(404).json({ message: 'Event not found' });
    }

    await conn.query('DELETE FROM calendar_events WHERE id = ?', [id]);

    conn.release();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
