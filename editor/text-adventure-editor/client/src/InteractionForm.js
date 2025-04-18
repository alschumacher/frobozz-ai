import React, { useState } from 'react';

const InteractionForm = ({ interaction = {}, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    key: interaction?.key || '',
    message: interaction?.message || '',
    events: interaction?.events || {},
    new_state: interaction?.new_state || null,
    consumed: interaction?.consumed === undefined ? null : interaction.consumed,
    is_repeatable: interaction?.is_repeatable === undefined ? true : interaction.is_repeatable,
    // Hidden fields that should be present but not editable
    item: interaction?.item || null,
    success: interaction?.success === undefined ? false : interaction.success
  });

  const [eventsJson, setEventsJson] = useState(JSON.stringify(formData.events || {}, null, 2));
  const [jsonError, setJsonError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEventsChange = (e) => {
    setEventsJson(e.target.value);
    try {
      const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : {};
      setFormData(prev => ({ ...prev, events: parsed }));
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jsonError) return;

    // For new_state, if it's an empty string, set it to null
    const processedData = {
      ...formData,
      new_state: formData.new_state === '' ? null : formData.new_state
    };

    onSave(processedData);
  };

  return (
    <div className="bg-white p-4 border rounded shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {interaction?.key ? `Edit Interaction: ${interaction.key}` : 'Add New Interaction'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="key" className="block text-sm font-medium mb-1">Key*</label>
          <input
            id="key"
            name="key"
            type="text"
            value={formData.key}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            placeholder="e.g., use_key, open_door"
          />
          <p className="text-xs text-gray-500 mt-1">The lookup key for this interaction</p>
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="block text-sm font-medium mb-1">Display Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Message to display when this interaction occurs"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="events" className="block text-sm font-medium mb-1">Events (JSON)</label>
          <textarea
            id="events"
            name="events"
            value={eventsJson}
            onChange={handleEventsChange}
            className={`w-full p-2 border rounded font-mono text-sm ${jsonError ? 'border-red-500' : ''}`}
            rows="4"
            placeholder='{"flag_name": true, "counter": 1}'
          />
          {jsonError && <p className="text-red-500 text-xs mt-1">{jsonError}</p>}
          <p className="text-xs text-gray-500 mt-1">Game flags to change after this interaction</p>
        </div>

        <div className="mb-3">
          <label htmlFor="new_state" className="block text-sm font-medium mb-1">New State</label>
          <input
            id="new_state"
            name="new_state"
            type="text"
            value={formData.new_state === null ? '' : formData.new_state}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="State to change to after interaction (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <input
              id="consumed"
              name="consumed"
              type="checkbox"
              checked={formData.consumed === true}
              onChange={(e) => setFormData(prev => ({ ...prev, consumed: e.target.checked ? true : null }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label htmlFor="consumed" className="text-sm select-none">Item consumed after use</label>
          </div>

          <div className="flex items-center">
            <input
              id="is_repeatable"
              name="is_repeatable"
              type="checkbox"
              checked={formData.is_repeatable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label htmlFor="is_repeatable" className="text-sm select-none">Action is repeatable</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            disabled={jsonError !== ''}
          >
            Save Interaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default InteractionForm;