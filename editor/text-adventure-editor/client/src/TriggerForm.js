import React, { useState } from 'react';

const TriggerForm = ({ trigger = {}, properties, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    key: trigger?.key || '',
    isDescriptionTrigger: trigger?.isDescriptionTrigger || false,
    ...properties.reduce((acc, prop) => ({
      ...acc,
      [prop.name]: trigger?.[prop.name] ?? prop.default
    }), {})
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.key) newErrors.key = 'Key is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };


  return (
    <div className="bg-white p-4 border rounded shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {trigger?.key ? `Edit Trigger: ${trigger.key}` : 'Add New Trigger'}
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
          <p className="text-xs text-gray-500 mt-1">The lookup key for this trigger</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {properties.map(prop => (
            <div key={prop.name}>
              <input
                type="checkbox"
                id={prop.name}
                checked={formData[prop.name]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [prop.name]: e.target.checked
                }))}
              />
              <label htmlFor={prop.name}>{prop.label}</label>
            </div>
          ))}
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
          >
            Save Trigger
          </button>
        </div>
        <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDescriptionTrigger"
            checked={formData.isDescriptionTrigger}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              isDescriptionTrigger: e.target.checked
            }))}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
          />
          <label htmlFor="isDescriptionTrigger" className="text-sm text-gray-700">
            Description Trigger
          </label>
        </div>
      </div>
      </form>
    </div>
  );
};

export default TriggerForm;