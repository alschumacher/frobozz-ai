import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

const ExportSettings = ({ projectId, onSave, onClose }) => {
  const [settings, setSettings] = useState({
    start_area: '',
    game_state: {
      inventory: [],
      log: ['[GAME START]'],
      score: 0,
      timer: 0,
      artifacts: {},
      id_to_name: {},
      events: {},
      interactions: {},
      visited_tiles: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newInventoryItem, setNewInventoryItem] = useState('');
  const [newVisitedTile, setNewVisitedTile] = useState('');
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    key: '',
    displayMessage: '',
    events: '{}',
    newState: '',
    itemConsumed: false,
    repeatable: true
  });

  useEffect(() => {
    if (projectId) {
      fetchSettings();
    }
  }, [projectId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/export-settings`);
      if (!response.ok) {
        if (response.status === 404) {
          // Create new settings
          const createResponse = await fetch(`${API_URL}/projects/${projectId}/export-settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start_area: '',
              game_state: settings.game_state
            }),
          });
          if (!createResponse.ok) {
            throw new Error('Failed to create initial export settings');
          }
          return;
        }
        throw new Error('Failed to fetch export settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/export-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_area: settings.start_area,
          game_state: settings.game_state
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save export settings');
      }

      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGameStateChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      game_state: {
        ...prev.game_state,
        [field]: value
      }
    }));
  };

  const handleAddInventoryItem = () => {
    if (newInventoryItem.trim()) {
      setSettings(prev => ({
        ...prev,
        game_state: {
          ...prev.game_state,
          inventory: [...prev.game_state.inventory, newInventoryItem.trim()]
        }
      }));
      setNewInventoryItem('');
    }
  };

  const handleRemoveInventoryItem = (index) => {
    setSettings(prev => ({
      ...prev,
      game_state: {
        ...prev.game_state,
        inventory: prev.game_state.inventory.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddVisitedTile = () => {
    if (newVisitedTile.trim()) {
      setSettings(prev => ({
        ...prev,
        game_state: {
          ...prev.game_state,
          visited_tiles: [...prev.game_state.visited_tiles, newVisitedTile.trim()]
        }
      }));
      setNewVisitedTile('');
    }
  };

  const handleRemoveVisitedTile = (index) => {
    setSettings(prev => ({
      ...prev,
      game_state: {
        ...prev.game_state,
        visited_tiles: prev.game_state.visited_tiles.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddInteraction = () => {
    try {
      const eventsObj = JSON.parse(newInteraction.events);
      setSettings(prev => ({
        ...prev,
        game_state: {
          ...prev.game_state,
          interactions: {
            ...prev.game_state.interactions,
            [newInteraction.key.trim()]: {
              message: newInteraction.displayMessage,
              events: eventsObj,
              newState: newInteraction.newState,
              itemConsumed: newInteraction.itemConsumed,
              repeatable: newInteraction.repeatable
            }
          }
        }
      }));
      setNewInteraction({
        key: '',
        displayMessage: '',
        events: '{}',
        newState: '',
        itemConsumed: false,
        repeatable: true
      });
      setShowAddInteraction(false);
    } catch (err) {
      setError('Invalid JSON in events field');
    }
  };

  const handleRemoveInteraction = (key) => {
    setSettings(prev => {
      const newInteractions = { ...prev.game_state.interactions };
      delete newInteractions[key];
      return {
        ...prev,
        game_state: {
          ...prev.game_state,
          interactions: newInteractions
        }
      };
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Export Settings</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Close
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Start Area</label>
        <input
          type="text"
          value={settings.start_area}
          onChange={(e) => handleChange('start_area', e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter start area ID"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Initial Score</label>
        <input
          type="number"
          value={settings.game_state.score}
          onChange={(e) => handleGameStateChange('score', parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Initial Timer</label>
        <input
          type="number"
          value={settings.game_state.timer}
          onChange={(e) => handleGameStateChange('timer', parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Visited Tiles</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newVisitedTile}
            onChange={(e) => setNewVisitedTile(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter tile ID"
          />
          <button
            onClick={handleAddVisitedTile}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {settings.game_state.visited_tiles.map((tile, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 p-2 bg-gray-100 rounded">{tile}</span>
              <button
                onClick={() => handleRemoveVisitedTile(index)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Initial Inventory</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newInventoryItem}
            onChange={(e) => setNewInventoryItem(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter item ID"
          />
          <button
            onClick={handleAddInventoryItem}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {settings.game_state.inventory.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 p-2 bg-gray-100 rounded">{item}</span>
              <button
                onClick={() => handleRemoveInventoryItem(index)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Interactions</label>
          <button
            onClick={() => setShowAddInteraction(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Interaction
          </button>
        </div>
        
        {showAddInteraction && (
          <div className="border rounded p-4 mb-4">
            <h3 className="text-lg font-medium mb-4">Add New Interaction</h3>
            
            <div className="mb-3">
              <label className="block text-sm mb-1">Key*</label>
              <input
                type="text"
                value={newInteraction.key}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, key: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="e.g., use_key_open_door"
              />
              <div className="text-sm text-gray-600">The lookup key for this interaction</div>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Display Message</label>
              <textarea
                value={newInteraction.displayMessage}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, displayMessage: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Message to display when this interaction occurs"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Events (JSON)</label>
              <textarea
                value={newInteraction.events}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, events: e.target.value }))}
                className="w-full p-2 border rounded font-mono"
                rows={3}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">New State</label>
              <input
                type="text"
                value={newInteraction.newState}
                onChange={(e) => setNewInteraction(prev => ({ ...prev, newState: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="State to change to after interaction"
              />
              <div className="text-sm text-gray-600">Game flags to change after this interaction</div>
            </div>

            <div className="mb-3 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newInteraction.itemConsumed}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, itemConsumed: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Item consumed after use</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newInteraction.repeatable}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, repeatable: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Action is repeatable</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddInteraction(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInteraction}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Interaction
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {Object.entries(settings.game_state.interactions).map(([key, interaction]) => (
            <div key={key} className="border rounded p-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{key}</span>
                <button
                  onClick={() => handleRemoveInteraction(key)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="text-sm mt-1">
                <div>Message: {interaction.message}</div>
                <div>Events: {JSON.stringify(interaction.events)}</div>
                <div>New State: {interaction.newState}</div>
                <div>
                  {interaction.itemConsumed && "Item consumed after use • "}
                  {interaction.repeatable && "Action is repeatable"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportSettings; 