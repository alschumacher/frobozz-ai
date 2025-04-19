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
  try {
    db = await open({
      filename: path.join(__dirname, 'crud.db'),
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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
        interactions TEXT DEFAULT '{}',
        project_id INTEGER DEFAULT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS export_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        start_area TEXT NOT NULL,
        game_state TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    // Check if container_description column exists, if not add it
    const tableInfo = await db.all("PRAGMA table_info(items)");
    const hasContainerDescription = tableInfo.some(col => col.name === 'container_description');
    
    if (!hasContainerDescription) {
      await db.exec('ALTER TABLE items ADD COLUMN container_description TEXT DEFAULT ""');
      console.log('Added container_description column to items table');
    }

    // Check if project_id column exists, if not add it
    const hasProjectId = tableInfo.some(col => col.name === 'project_id');
    
    if (!hasProjectId) {
      await db.exec('ALTER TABLE items ADD COLUMN project_id INTEGER DEFAULT NULL');
      console.log('Added project_id column to items table');
    }

    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
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
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.all('SELECT rowid as id, name, created_at FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // First check if project with same name exists
    const existingProject = await db.get('SELECT * FROM projects WHERE name = ?', [name]);
    if (existingProject) {
      return res.status(400).json({ error: 'Project with this name already exists' });
    }

    // Insert new project
    const stmt = await db.prepare('INSERT INTO projects (name) VALUES (?)');
    const result = await stmt.run(name);
    await stmt.finalize();

    // Get the newly created project with its ID
    const project = await db.get('SELECT rowid as id, name, created_at FROM projects WHERE rowid = ?', [result.lastID]);
    
    if (!project) {
      throw new Error('Failed to retrieve created project');
    }

    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = 'SELECT * FROM items';
    let params = [];

    if (project_id) {
      query += ' WHERE project_id = ?';
      params.push(project_id);
    }

    const items = await db.all(query, params);
    const parsedItems = items.map(parseJsonFields);
    res.json(parsedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items/assign-project', async (req, res) => {
  try {
    const { item_ids, project_id } = req.body;
    
    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({ error: 'Item IDs are required' });
    }
    
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // First verify the project exists
    const project = await db.get('SELECT rowid as id, name, created_at FROM projects WHERE rowid = ?', [project_id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update each item's project_id
    const stmt = await db.prepare('UPDATE items SET project_id = ? WHERE id = ?');
    for (const itemId of item_ids) {
      await stmt.run(project_id, itemId);
    }
    await stmt.finalize();

    res.json({ message: 'Items assigned to project successfully' });
  } catch (error) {
    console.error('Error assigning items to project:', error);
    res.status(500).json({ error: error.message || 'Failed to assign items to project' });
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
    const { project_id } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Get export settings for the project
    const settings = await db.get('SELECT * FROM export_settings WHERE project_id = ?', [project_id]);
    if (!settings) {
      return res.status(404).json({ error: 'Export settings not found for this project' });
    }

    // Get all items for the project
    const items = await db.all('SELECT * FROM items WHERE project_id = ?', [project_id]);
    const parsedItems = items.map(parseJsonFields);

    // Create the export data with settings
    const exportData = {
      start_area: settings.start_area,
      game_state: JSON.parse(settings.game_state),
      artifacts: parsedItems
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting items with settings:', error);
    res.status(500).json({ error: 'Failed to export items' });
  }
});

// Add DELETE endpoint for projects
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify the project exists
    const project = await db.get('SELECT rowid as id, name, created_at FROM projects WHERE rowid = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // First remove project_id from all items in this project
    await db.run('UPDATE items SET project_id = NULL WHERE project_id = ?', [id]);

    // Then delete the project
    await db.run('DELETE FROM projects WHERE rowid = ?', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

// Add endpoints for export settings
app.get('/api/projects/:id/export-settings', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await db.get('SELECT * FROM export_settings WHERE project_id = ?', [id]);
    if (!settings) {
      return res.status(404).json({ error: 'Export settings not found' });
    }
    res.json({
      ...settings,
      game_state: JSON.parse(settings.game_state)
    });
  } catch (error) {
    console.error('Error fetching export settings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch export settings' });
  }
});

app.post('/api/projects/:id/export-settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_area, game_state } = req.body;

    if (!start_area) {
      return res.status(400).json({ error: 'start_area is required' });
    }

    // Verify project exists
    const project = await db.get('SELECT rowid as id FROM projects WHERE rowid = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if settings already exist
    const existingSettings = await db.get('SELECT id FROM export_settings WHERE project_id = ?', [id]);
    
    if (existingSettings) {
      // Update existing settings
      await db.run(
        'UPDATE export_settings SET start_area = ?, game_state = ? WHERE project_id = ?',
        [start_area, JSON.stringify(game_state || {}), id]
      );
    } else {
      // Create new settings
      await db.run(
        'INSERT INTO export_settings (project_id, start_area, game_state) VALUES (?, ?, ?)',
        [id, start_area, JSON.stringify(game_state || {})]
      );
    }

    res.json({ message: 'Export settings saved successfully' });
  } catch (error) {
    console.error('Error saving export settings:', error);
    res.status(500).json({ error: error.message || 'Failed to save export settings' });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Available routes:');
      console.log('  GET /api/projects');
      console.log('  POST /api/projects');
      console.log('  POST /api/items/assign-project');
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();