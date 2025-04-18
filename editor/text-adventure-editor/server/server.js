// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

async function initializeDb() {
  // Open the database
  db = await open({
    filename: path.join(__dirname, 'crud.db'),
    driver: sqlite3.Database
  });

  // Create table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description_ TEXT,
      container_description TEXT DEFAULT '',
      fixtures_ TEXT DEFAULT '[]',
      items_ TEXT DEFAULT '[]',
      display_order TEXT DEFAULT '[]',
      exits_ TEXT DEFAULT '{}',
      properties TEXT DEFAULT '{}',
      triggers TEXT DEFAULT '{}',
      interactions TEXT DEFAULT '{}'
    )
  `);

  // Check if container_description column exists, if not add it
  const tableInfo = await db.all("PRAGMA table_info(items)");
  const hasContainerDescription = tableInfo.some(col => col.name === 'container_description');
  
  if (!hasContainerDescription) {
    await db.exec('ALTER TABLE items ADD COLUMN container_description TEXT DEFAULT ""');
    console.log('Added container_description column to items table');
  }

  console.log('Database initialized');
}

// Helper function to parse JSON fields
function parseJsonFields(item) {
  return {
    ...item,
    description_: item.description_ ? JSON.parse(item.description_) : { start: '', end: '' },
    container_description: item.container_description || '',
    fixtures_: JSON.parse(item.fixtures_ || '[]'),
    items_: JSON.parse(item.items_ || '[]'),
    display_order: JSON.parse(item.display_order || '[]'),
    exits_: JSON.parse(item.exits_ || '{}'),
    properties: JSON.parse(item.properties || '{}'),
    triggers: JSON.parse(item.triggers || '{}'),
    interactions: JSON.parse(item.interactions || '{}')
  };
}

// Helper function to stringify JSON fields
function stringifyJsonFields(item) {
  return {
    ...item,
    description_: JSON.stringify(item.description_ || { start: '', end: '' }),
    container_description: item.container_description || '',
    fixtures_: JSON.stringify(item.fixtures_ || []),
    items_: JSON.stringify(item.items_ || []),
    display_order: JSON.stringify(item.display_order || []),
    exits_: JSON.stringify(item.exits_ || {}),
    properties: JSON.stringify(item.properties || {}),
    triggers: JSON.stringify(item.triggers || {}),
    interactions: JSON.stringify(item.interactions || {})
  };
}

// API Routes
app.get('/api/items', async (req, res) => {
  try {
    const items = await db.all('SELECT * FROM items');
    // Parse JSON strings back to objects/arrays
    const parsedItems = items.map(parseJsonFields);
    res.json(parsedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Parse JSON strings back to objects/arrays
    const parsedItem = parseJsonFields(item);
    res.json(parsedItem);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = req.body;

    // Validate required fields
    if (!item.id || !item.type || !item.name) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['id', 'type', 'name']
      });
    }

    // Ensure interactions field exists
    if (!item.interactions) {
      item.interactions = {};
    }

    // Convert object/array fields to JSON strings for storage
    const stmtItem = stringifyJsonFields(item);

    await db.run(`
      INSERT INTO items (id, type, name, description_, container_description, fixtures_, items_, display_order,
                        exits_, properties, triggers, interactions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      stmtItem.id,
      stmtItem.type,
      stmtItem.name,
      stmtItem.description_,
      stmtItem.container_description,
      stmtItem.fixtures_,
      stmtItem.items_,
      stmtItem.display_order,
      stmtItem.exits_,
      stmtItem.properties,
      stmtItem.triggers,
      stmtItem.interactions
    ]);

    res.status(201).json({ message: 'Item created successfully', id: item.id });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const item = req.body;

    // Validate required fields
    if (!item.type || !item.name) {
      console.log('missing required fields')
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'name']
      });
    }

    // Ensure interactions field exists
    if (!item.interactions) {
      item.interactions = {};
    }

    // Handle description_ field - ensure it's a proper object
    if (typeof item.description_ === 'string') {
      item.description_ = { start: item.description_, end: '' };
    } else if (!item.description_) {
      item.description_ = { start: '', end: '' };
    }

    // Convert object/array fields to JSON strings for storage
    const stmtItem = {
      ...item,
      description_: JSON.stringify(item.description_),
      container_description: item.container_description || '',
      fixtures_: JSON.stringify(item.fixtures_ || []),
      items_: JSON.stringify(item.items_ || []),
      display_order: JSON.stringify(item.display_order || []),
      exits_: JSON.stringify(item.exits_ || {}),
      properties: JSON.stringify(item.properties || {}),
      triggers: JSON.stringify(item.triggers || {}),
      interactions: JSON.stringify(item.interactions || {})
    };

    const result = await db.run(`
      UPDATE items
      SET type = ?, name = ?, description_ = ?, container_description = ?, fixtures_ = ?,
          items_ = ?, display_order = ?, exits_ = ?,
          properties = ?, triggers = ?, interactions = ?
      WHERE id = ?
    `, [
      stmtItem.type,
      stmtItem.name,
      stmtItem.description_,
      stmtItem.container_description,
      stmtItem.fixtures_,
      stmtItem.items_,
      stmtItem.display_order,
      stmtItem.exits_,
      stmtItem.properties,
      stmtItem.triggers,
      stmtItem.interactions,
      req.params.id
    ]);

    if (result.changes === 0) {
      console.log('item not found')
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.log(error)
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM items WHERE id = ?', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    const items = await db.all('SELECT * FROM items');
    const parsedItems = items.map(parseJsonFields); // Convert JSON strings to objects
    res.json(parsedItems);
  } catch (error) {
    console.error('Error exporting items:', error);
    res.status(500).json({ error: 'Failed to export items' });
  }
});

// Add POST handler for export with settings
app.post('/api/export', async (req, res) => {
  try {
    const { start_area, game_state } = req.body;
    
    // Validate required fields
    if (!start_area) {
      return res.status(400).json({ error: 'start_area is required' });
    }

    // Get all items
    const items = await db.all('SELECT * FROM items');
    const parsedItems = items.map(parseJsonFields);

    // Create the export data with settings
    const exportData = {
      start_area,
      game_state: game_state || {
        inventory: [],
        log: ['[GAME START]'],
        score: 0,
        timer: 0,
        artifacts: {},
        id_to_name: {},
        events: {},
        interactions: {},
        visited_tiles: []
      },
      artifacts: parsedItems
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting items with settings:', error);
    res.status(500).json({ error: 'Failed to export items' });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();