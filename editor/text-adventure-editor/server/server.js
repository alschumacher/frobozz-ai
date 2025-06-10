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
    console.log('Initializing database...');
    db = await open({
      filename: path.join(__dirname, 'crud.db'),
      driver: sqlite3.Database
    });

    console.log('Database opened successfully');

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        state_events TEXT DEFAULT '{}'
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

    console.log('Tables created successfully');

    // Verify projects table structure
    const projectsTableInfo = await db.all("PRAGMA table_info(projects)");
    console.log('Projects table structure:', projectsTableInfo);

    // Check if state_events column exists in projects table
    const hasStateEvents = projectsTableInfo.some(col => col.name === 'state_events');
    if (!hasStateEvents) {
      console.log('Adding state_events column to projects table');
      await db.exec('ALTER TABLE projects ADD COLUMN state_events TEXT DEFAULT "{}"');
      console.log('Added state_events column to projects table');
    }

  // Check if container_description column exists, if not add it
  const tableInfo = await db.all("PRAGMA table_info(items)");
  const hasContainerDescription = tableInfo.some(col => col.name === 'container_description');
  
  if (!hasContainerDescription) {
    await db.exec('ALTER TABLE items ADD COLUMN container_description TEXT DEFAULT ""');
    console.log('Added container_description column to items table');
  }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', error.message);
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

// Export endpoint
app.post('/api/export', async (req, res) => {
  try {
    const { project_id } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Get export settings for the project
    const exportSettings = await db.get(
      'SELECT * FROM export_settings WHERE project_id = ?',
      [project_id]
    );

    if (!exportSettings) {
      return res.status(404).json({ error: 'Export settings not found for this project' });
    }

    // Get state events for the project
    const projectWithEvents = await db.get(
      'SELECT state_events FROM projects WHERE rowid = ?',
      [project_id]
    );

    // Parse state events, defaulting to empty object if null/undefined
    const stateEvents = projectWithEvents?.state_events ? JSON.parse(projectWithEvents.state_events) : {};

    // Get all items for the project
    const items = await db.all('SELECT * FROM items WHERE project_id = ?', [project_id]);
    const parsedItems = items.map(parseJsonFields);

    // Parse the game state and merge with state events
    let gameState = {};
    try {
      gameState = JSON.parse(exportSettings.game_state || '{}');
    } catch (e) {
      console.error('Error parsing game state:', e);
      gameState = {};
    }

    // Ensure game_state is an object and merge state events
    if (typeof gameState !== 'object' || gameState === null) {
      gameState = {};
    }
    gameState.state_events = stateEvents;

    // Prepare the export data
    const exportData = {
      artifacts: parsedItems,
      start_area: exportSettings.start_area,
      game_state: gameState
    };

    console.log('Exporting data:', JSON.stringify(exportData, null, 2));
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting project:', error);
    res.status(500).json({ error: error.message || 'Failed to export project' });
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

// Export settings endpoints
app.get('/api/projects/:id/export-settings', async (req, res) => {
  try {
    const settings = await db.get(
      'SELECT * FROM export_settings WHERE project_id = ?',
      [req.params.id]
    );

    if (!settings) {
      return res.status(404).json({ error: 'Export settings not found' });
    }

    res.json({
      ...settings,
      game_state: JSON.parse(settings.game_state)
    });
  } catch (error) {
    console.error('Error fetching export settings:', error);
    res.status(500).json({ error: 'Failed to fetch export settings' });
  }
});

app.post('/api/projects/:id/export-settings', async (req, res) => {
  try {
    const { start_area, game_state } = req.body;
    
    if (!start_area) {
      return res.status(400).json({ error: 'Start area is required' });
    }

    // Get current state events
    const projectWithEvents = await db.get(
      'SELECT state_events FROM projects WHERE rowid = ?',
      [req.params.id]
    );

    // Parse state events, defaulting to empty object if null/undefined
    const stateEvents = projectWithEvents?.state_events ? JSON.parse(projectWithEvents.state_events) : {};

    // Initialize game state if not provided
    let finalGameState = game_state || {
      inventory: [],
      log: ['[GAME START]'],
      score: 0,
      timer: 0,
      artifacts: {},
      id_to_name: {},
      events: {},
      interactions: {},
      visited_tiles: []
    };

    // Ensure game_state is an object
    if (typeof finalGameState !== 'object' || finalGameState === null) {
      finalGameState = {};
    }

    // Merge state events into game state
    finalGameState.state_events = stateEvents;

    // Check if settings already exist
    const existingSettings = await db.get(
      'SELECT * FROM export_settings WHERE project_id = ?',
      [req.params.id]
    );

    if (existingSettings) {
      // Update existing settings
      await db.run(
        'UPDATE export_settings SET start_area = ?, game_state = ? WHERE project_id = ?',
        [start_area, JSON.stringify(finalGameState), req.params.id]
      );
    } else {
      // Create new settings
      await db.run(
        'INSERT INTO export_settings (project_id, start_area, game_state) VALUES (?, ?, ?)',
        [req.params.id, start_area, JSON.stringify(finalGameState)]
      );
    }

    res.json({ message: 'Export settings saved successfully' });
  } catch (error) {
    console.error('Error saving export settings:', error);
    res.status(500).json({ error: 'Failed to save export settings' });
  }
});

// State events endpoints
app.get('/api/projects/:id/state-events', async (req, res) => {
  try {
    console.log('Fetching state events for project:', req.params.id);
    
    // First verify the project exists
    const project = await db.get('SELECT rowid as id, name FROM projects WHERE rowid = ?', [req.params.id]);
    console.log('Project check result:', project);
    
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the project with state events
    const projectWithEvents = await db.get('SELECT state_events FROM projects WHERE rowid = ?', [req.params.id]);
    console.log('Project query result:', projectWithEvents);
    
    if (!projectWithEvents) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    // If state_events is null or undefined, return an empty object
    const stateEvents = projectWithEvents.state_events || '{}';
    try {
      const parsedEvents = JSON.parse(stateEvents);
      res.json({ state_events: parsedEvents });
    } catch (parseError) {
      console.error('Error parsing state events:', parseError);
      console.error('Raw state events:', stateEvents);
      res.json({ state_events: {} });
    }
  } catch (error) {
    console.error('Error fetching state events:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch state events', details: error.message });
  }
});

app.post('/api/projects/:id/state-events', async (req, res) => {
  try {
    console.log('Saving state events for project:', req.params.id);
    console.log('Request body:', req.body);
    
    const { state_events } = req.body;
    
    if (!state_events) {
      console.log('No state events provided');
      return res.status(400).json({ error: 'State events are required' });
    }

    // Validate JSON structure
    try {
      JSON.parse(JSON.stringify(state_events));
    } catch (e) {
      console.error('Invalid state events format:', e);
      return res.status(400).json({ error: 'Invalid state events format', details: e.message });
    }

    // Check if project exists
    const project = await db.get('SELECT rowid as id FROM projects WHERE rowid = ?', [req.params.id]);
    console.log('Project check result:', project);
    
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    const stateEventsString = JSON.stringify(state_events);
    console.log('Saving state events:', stateEventsString);
    
    await db.run(
      'UPDATE projects SET state_events = ? WHERE rowid = ?',
      [stateEventsString, req.params.id]
    );

    res.json({ message: 'State events saved successfully' });
  } catch (error) {
    console.error('Error saving state events:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to save state events', details: error.message });
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