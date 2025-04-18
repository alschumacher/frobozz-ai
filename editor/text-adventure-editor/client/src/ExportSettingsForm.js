import React, { useState } from 'react';
import GameStateForm from './GameStateForm';

const ExportSettingsForm = ({ areas, items, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
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

  const [showGameStateForm, setShowGameStateForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGameStateSave = (gameState) => {
    console.log('Saving game state:', gameState);
    setFormData(prev => ({
      ...prev,
      game_state: gameState
    }));
    setShowGameStateForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.start_area) {
      return;
    }
    console.log('Submitting export with data:', formData);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Export Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="start_area" className="block text-sm font-medium mb-1">Starting Area*</label>
            <select
              id="start_area"
              name="start_area"
              value={formData.start_area}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">Select a starting area...</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Game State Settings</label>
              <button
                type="button"
                onClick={() => {
                  console.log('Opening game state form');
                  setShowGameStateForm(true);
                }}
                className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Edit Game State
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-sm">Score: </span>
                  <span className="text-sm">{formData.game_state.score}</span>
                </div>
                <div>
                  <span className="font-medium text-sm">Timer: </span>
                  <span className="text-sm">{formData.game_state.timer}</span>
                </div>
                <div>
                  <span className="font-medium text-sm">Initial Inventory: </span>
                  <span className="text-sm">{formData.game_state.inventory.join(', ') || 'None'}</span>
                </div>
                <div>
                  <span className="font-medium text-sm">Initial Log: </span>
                  <span className="text-sm">{formData.game_state.log.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!formData.start_area}
            >
              Export
            </button>
          </div>
        </form>

        {showGameStateForm && (
          <GameStateForm
            initialData={formData.game_state}
            onSubmit={handleGameStateSave}
            onCancel={() => setShowGameStateForm(false)}
            items={items}
          />
        )}
      </div>
    </div>
  );
};

export default ExportSettingsForm; 