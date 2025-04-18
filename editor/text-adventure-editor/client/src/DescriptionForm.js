// DescriptionForm.js
import React, { useState, useEffect } from 'react';

const DescriptionForm = ({ description = {}, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    start: description?.start || '',
    end: description?.end || '',
    triggers: description?.triggers || {}
  });

  // Reset form data when description prop changes
  useEffect(() => {
    setFormData({
      start: description?.start || '',
      end: description?.end || '',
      triggers: description?.triggers || {}
    });
  }, [description]);

  const [newTriggerKey, setNewTriggerKey] = useState('');
  const [editingTrigger, setEditingTrigger] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTriggerChange = (triggerKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      triggers: {
        ...prev.triggers,
        [triggerKey]: {
          ...prev.triggers[triggerKey],
          [field]: value
        }
      }
    }));
  };

  const handleAddTrigger = () => {
    if (!newTriggerKey.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      triggers: {
        ...prev.triggers,
        [newTriggerKey]: {
          start: '',
          end: ''
        }
      }
    }));
    setNewTriggerKey('');
  };

  const handleDeleteTrigger = (triggerKey) => {
    setFormData(prev => {
      const newTriggers = { ...prev.triggers };
      delete newTriggers[triggerKey];
      return {
        ...prev,
        triggers: newTriggers
      };
    });
  };

  const handleEditTrigger = (triggerKey) => {
    setEditingTrigger(triggerKey);
  };

  const handleSaveTrigger = (triggerKey) => {
    setEditingTrigger(null);
  };

  const handleSaveClick = () => {
    onSave(formData);
  };

  return (
    <div className="bg-white p-4 border rounded shadow-sm">
      <div>
        <h3 className="text-lg font-medium mb-4">
          {description?.start ? 'Edit Description' : 'Add Description'}
        </h3>

        <div className="mb-4">
          <label htmlFor="start" className="block text-sm font-medium mb-1">Initial Description</label>
          <textarea
            id="start"
            name="start"
            value={formData.start}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Description shown before listing items"
          />
          <p className="text-xs text-gray-500 mt-1">Initial description of the item/area</p>
        </div>

        <div className="mb-4">
          <label htmlFor="end" className="block text-sm font-medium mb-1">End Description</label>
          <textarea
            id="end"
            name="end"
            value={formData.end}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Description shown after listing items"
          />
          <p className="text-xs text-gray-500 mt-1">Additional description shown after listing items</p>
        </div>

        {/* Triggers Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <label className="block text-sm font-medium">Triggers</label>
              <p className="text-xs text-gray-500">Add multiple triggers to control different states</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTriggerKey}
                onChange={(e) => setNewTriggerKey(e.target.value)}
                className="p-2 border rounded text-sm"
                placeholder="Enter trigger name"
              />
              <button
                type="button"
                onClick={handleAddTrigger}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add Trigger
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(formData.triggers).length === 0 ? (
              <div className="text-sm text-gray-500 italic p-2 border rounded bg-gray-50">
                No triggers added yet. Add a trigger to control different states of this item.
              </div>
            ) : (
              Object.entries(formData.triggers).map(([triggerKey, triggerData]) => (
                <div key={triggerKey} className="p-3 border rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{triggerKey}</span>
                    <div className="flex gap-2">
                      {editingTrigger === triggerKey ? (
                        <button
                          type="button"
                          onClick={() => handleSaveTrigger(triggerKey)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditTrigger(triggerKey)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTrigger(triggerKey)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {editingTrigger === triggerKey ? (
                    <>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Start Description</label>
                        <textarea
                          value={triggerData.start}
                          onChange={(e) => handleTriggerChange(triggerKey, 'start', e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                          rows="2"
                          placeholder="Description shown when trigger is active"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">End Description</label>
                        <textarea
                          value={triggerData.end}
                          onChange={(e) => handleTriggerChange(triggerKey, 'end', e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                          rows="2"
                          placeholder="Description shown after trigger is complete"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p><strong>Start:</strong> {triggerData.start || 'No start description'}</p>
                      <p><strong>End:</strong> {triggerData.end || 'No end description'}</p>
                    </div>
                  )}
                </div>
              ))
            )}
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
            type="button"
            onClick={handleSaveClick}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Save Description
          </button>
        </div>
      </div>
    </div>
  );
};

export default DescriptionForm;  // Make sure this export is here!