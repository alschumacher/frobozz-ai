import React, { useState } from 'react';
import InteractionForm from './InteractionForm';

const GameStateForm = ({ initialData = {}, onSubmit, onCancel, items = [] }) => {
  const [formData, setFormData] = useState({
    inventory: initialData.inventory || [],
    log: initialData.log || ['[GAME START]'],
    score: initialData.score || 0,
    timer: initialData.timer || 0,
    artifacts: initialData.artifacts || {},
    id_to_name: initialData.id_to_name || {},
    events: initialData.events || {},
    interactions: initialData.interactions || {},
    visited_tiles: initialData.visited_tiles || []
  });

  const [newInventoryItem, setNewInventoryItem] = useState('');
  const [newVisitedArea, setNewVisitedArea] = useState('');
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [interactionsList, setInteractionsList] = useState(
    Object.entries(initialData.interactions || {}).map(([key, value]) => ({ key, ...value }))
  );

  // Get available items and areas for dropdowns
  const availableItems = items.filter(item => item.type === 'item').map(item => item.id);
  const availableAreas = items.filter(item => item.type === 'area').map(item => item.id);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const addToArray = (field, value) => {
    if (!value || formData[field].includes(value)) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }));
  };

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddInteraction = () => {
    setCurrentInteraction(null);
    setShowInteractionForm(true);
  };

  const handleEditInteraction = (interaction) => {
    setCurrentInteraction(interaction);
    setShowInteractionForm(true);
  };

  const handleDeleteInteraction = (key) => {
    setInteractionsList(prev => prev.filter(i => i.key !== key));
  };

  const handleSaveInteraction = (interaction) => {
    if (currentInteraction) {
      setInteractionsList(prev => prev.map(i =>
        i.key === currentInteraction.key ? interaction : i
      ));
    } else {
      setInteractionsList(prev => [...prev, interaction]);
    }
    setShowInteractionForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert interactions list to object format
    const interactionsObj = {};
    interactionsList.forEach(interaction => {
      const { key, ...rest } = interaction;
      interactionsObj[key] = rest;
    });

    onSubmit({
      ...formData,
      interactions: interactionsObj
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Game State Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="score" className="block text-sm font-medium mb-1">Initial Score</label>
              <input
                type="number"
                id="score"
                name="score"
                value={formData.score}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="timer" className="block text-sm font-medium mb-1">Initial Timer</label>
              <input
                type="number"
                id="timer"
                name="timer"
                value={formData.timer}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                min="0"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Initial Inventory</label>
            <div className="flex mb-2">
              <select
                className="flex-grow p-2 border border-gray-300 rounded-l"
                value={newInventoryItem}
                onChange={(e) => setNewInventoryItem(e.target.value)}
              >
                <option value="">Select an item...</option>
                {availableItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  addToArray('inventory', newInventoryItem);
                  setNewInventoryItem('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.inventory.map((item, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray('inventory', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="log" className="block text-sm font-medium mb-1">Initial Log (comma-separated)</label>
            <input
              type="text"
              id="log"
              value={formData.log.join(', ')}
              onChange={(e) => handleArrayChange('log', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="[GAME START], Welcome message"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Visited Areas</label>
            <div className="flex mb-2">
              <select
                className="flex-grow p-2 border border-gray-300 rounded-l"
                value={newVisitedArea}
                onChange={(e) => setNewVisitedArea(e.target.value)}
              >
                <option value="">Select an area...</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  addToArray('visited_tiles', newVisitedArea);
                  setNewVisitedArea('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.visited_tiles.map((area, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm">
                  <span>{area}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray('visited_tiles', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactions Management */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Interactions</label>
              <button
                type="button"
                onClick={handleAddInteraction}
                className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Add Interaction
              </button>
            </div>

            {interactionsList.length === 0 ? (
              <p className="text-sm text-gray-500 mb-2">No interactions defined. Click 'Add Interaction' to create one.</p>
            ) : (
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repeatable</th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interactionsList.map((interaction) => (
                      <tr key={interaction.key}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{interaction.key}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{interaction.message}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{interaction.is_repeatable ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                          <button
                            type="button"
                            onClick={() => handleEditInteraction(interaction)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInteraction(interaction.key)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            >
              Save
            </button>
          </div>
        </form>

        {showInteractionForm && (
          <InteractionForm
            interaction={currentInteraction}
            onSave={handleSaveInteraction}
            onCancel={() => setShowInteractionForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default GameStateForm; 