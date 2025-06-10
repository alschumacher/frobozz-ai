import React, { useState, useEffect } from 'react';
import InteractionForm from './InteractionForm';
import TriggerForm from './TriggerForm';
import DescriptionForm from './DescriptionForm';

// Define property schemas based on Pydantic models
const propertySchemas = {
  item: [
    { name: 'is_openable', label: 'Is Openable', default: false },
    { name: 'is_open', label: 'Is Open', default: false },
    { name: 'is_broken', label: 'Is Broken', default: false },
    { name: 'is_accessible', label: 'Is Accessible', default: true },
    { name: 'is_locked', label: 'Is Locked', default: false },
    { name: 'is_visible', label: 'Is Visible', default: true },
    { name: 'is_lit', label: 'Is Lit', default: false },
    { name: 'is_flammable', label: 'Is Flammable', default: false },
    { name: 'is_dark', label: 'Is Dark', default: false },
  ],
  fixture: [
    { name: 'is_openable', label: 'Is Openable', default: false },
    { name: 'is_open', label: 'Is Open', default: false },
    { name: 'is_locked', label: 'Is Locked', default: false },
    { name: 'is_visible', label: 'Is Visible', default: true },
    { name: 'is_lit', label: 'Is Lit', default: false },
    { name: 'is_flammable', label: 'Is Flammable', default: false },
    { name: 'is_dark', label: 'Is Dark', default: false },
    // is_accessible is always false for fixtures and not directly editable
  ],
  area: [
    { name: 'is_accessible', label: 'Is Accessible', default: true },
    { name: 'is_visible', label: 'Is Visible', default: true },
    { name: 'is_dark', label: 'Is Dark', default: false },
  ],
};

// Helper function to get default properties for a type
const getDefaultProperties = (type) => {
  const defaults = {};
  propertySchemas[type]?.forEach(prop => {
    defaults[prop.name] = prop.default;
  });
  // Special case: Fixtures always have is_accessible: false
  if (type === 'fixture') {
    defaults.is_accessible = false;
  }
  return defaults;
};


const ItemForm = ({ initialData, onSubmit, isEditing, onCancel, fixtureOptions = [], itemOptions = [], allItems = [] }) => {
  // Default state setup
  const defaultData = {
    type: 'area',
    id: '',
    name: '',
    description_: { start: '', end: '' },
    fixtures_: [],
    items_: [],
    display_order: [],
    exits_: {},
    properties: getDefaultProperties('area'),
    triggers: {},
    interactions: {}
  };

  // Initialize state with default data
  const [formData, setFormData] = useState(defaultData);
  const [triggersList, setTriggersList] = useState([]);
  const [interactionsList, setInteractionsList] = useState([]);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState(null);
  const [errors, setErrors] = useState({});
  const [newFixture, setNewFixture] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState('');
  const [exits, setExits] = useState({ north: '', south: '', east: '', west: '' });
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);

  // Process initial data when it changes
  useEffect(() => {
    if (initialData) {
      const processedData = {
        ...defaultData,
        ...initialData,
        description_: typeof initialData.description_ === 'string' 
          ? { start: initialData.description_, end: '' }
          : initialData.description_ || { start: '', end: '' },
        fixtures_: Array.isArray(initialData.fixtures_) ? initialData.fixtures_ : [],
        items_: Array.isArray(initialData.items_) ? initialData.items_ : [],
        display_order: Array.isArray(initialData.display_order) ? initialData.display_order : [],
        properties: { ...getDefaultProperties(initialData.type), ...(initialData.properties || {}) },
        triggers: initialData.triggers || {},
        interactions: initialData.interactions || {}
      };

      // Ensure description_ is properly structured
      if (typeof processedData.description_ === 'string') {
        processedData.description_ = { start: processedData.description_, end: '' };
      } else if (!processedData.description_ || typeof processedData.description_ !== 'object') {
        processedData.description_ = { start: '', end: '' };
      }

      setFormData(processedData);
      setTriggersList(Object.entries(initialData.triggers || {}).map(([key, value]) => ({ key, ...value })));
      setInteractionsList(Object.entries(initialData.interactions || {}).map(([key, value]) => ({ key, ...value })));
      
      // Set exits if it's an area
      if (initialData.type === 'area' && initialData.exits_) {
        const newExits = { north: '', south: '', east: '', west: '' };
        Object.entries(initialData.exits_).forEach(([areaId, direction]) => {
          if (direction === 'n') newExits.north = areaId;
          else if (direction === 's') newExits.south = areaId;
          else if (direction === 'e') newExits.east = areaId;
          else if (direction === 'w') newExits.west = areaId;
        });
        setExits(newExits);
      }
    } else {
      // Reset to default state for new items
      setFormData(defaultData);
      setTriggersList([]);
      setInteractionsList([]);
      setExits({ north: '', south: '', east: '', west: '' });
    }
  }, [initialData]);

  // Type options
  const typeOptions = ['area', 'fixture', 'item'];

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      const newType = value;
      const newDefaultProps = getDefaultProperties(newType);
      setFormData(prev => ({
        ...prev,
        type: newType,
        properties: newDefaultProps,
        exits_: newType === 'area' ? prev.exits_ : {}
      }));
      if (newType !== 'area') {
          setExits({ north: '', south: '', east: '', west: '' });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePropertyChange = (propertyName, checked) => {
    setFormData(prev => ({
        ...prev,
        properties: { ...prev.properties, [propertyName]: checked }
    }));
  };


  const handleExitChange = (direction, value) => {
    setExits(prev => ({ ...prev, [direction]: value }));
  };

  const addToArray = (field, value) => {
    if (!value.trim() || formData[field].includes(value)) return;
    setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
  };

  const removeFromArray = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSelectOption = (field, value) => {
    if (!value || formData[field].includes(value)) return;
    setFormData(prev => ({ ...prev, [field]: [...prev[field], value] }));
  };

  // --- Interaction Handlers ---
  const handleAddInteraction = () => {
    setCurrentInteraction(null); // Reset to create new
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
      // Edit existing interaction
      setInteractionsList(prev => prev.map(i =>
        i.key === currentInteraction.key ? interaction : i
      ));
    } else {
      // Add new interaction
      setInteractionsList(prev => [...prev, interaction]);
    }
    setShowInteractionForm(false);
  };

  // --- Trigger Handlers ---
  const handleAddTrigger = () => {
    setCurrentTrigger(null); // Reset to create new
    setShowTriggerForm(true);
  };

  const handleEditTrigger = (trigger) => {
    setCurrentTrigger(trigger);
    setShowTriggerForm(true);
  };

  const handleDeleteTrigger = (key) => {
    setTriggersList(prev => prev.filter(i => i.key !== key));
  };

  const handleSaveTrigger = (trigger) => {
    if (currentTrigger) {
      // Edit existing trigger
      setTriggersList(prev => prev.map(i =>
        i.key === currentTrigger.key ? trigger : i
      ));
    } else {
      // Add new trigger
      setTriggersList(prev => [...prev, trigger]);
    }
    setShowTriggerForm(false);
  };

  // --- Description Handlers ---
  const handleAddDescription = () => {
    setShowDescriptionForm(true);
  };

  const handleSaveDescription = (description) => {
    setFormData(prev => ({
      ...prev,
      description_: {
        start: description.start || '',
        end: description.end || '',
        triggers: description.triggers || {}
      }
    }));
    setShowDescriptionForm(false);
  };

  // --- Submit Handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.id) newErrors.id = 'ID is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); return;
    }

    // Convert interactions list to object format
    const interactionsObj = {};
    interactionsList.forEach(interaction => {
      const { key, ...rest } = interaction;
      interactionsObj[key] = rest;
    });

    const triggersObj = {};
    triggersList.forEach(trigger => {
      const { key, ...rest } = trigger;
      triggersObj[key] = rest;
    });

    // Ensure description_ is properly structured without double nesting
    const processedDescription = formData.description_ || { start: '', end: '' };
    if (typeof processedDescription === 'string') {
      processedDescription = { start: processedDescription, end: '' };
    }

    const processedFormData = {
      ...formData,
      description_: processedDescription,
      interactions: interactionsObj,
      triggers: triggersObj 
    };

    if (formData.type === 'area') {
      const processedExits = {};
      if (exits.north) processedExits[exits.north.trim()] = 'n';
      if (exits.south) processedExits[exits.south.trim()] = 's';
      if (exits.east) processedExits[exits.east.trim()] = 'e';
      if (exits.west) processedExits[exits.west.trim()] = 'w';
      processedFormData.exits_ = processedExits;
    } else {
      processedFormData.exits_ = {};
    }

    if (processedFormData.type === 'fixture') {
        processedFormData.properties = { ...(processedFormData.properties || {}), is_accessible: false };
    }
    onSubmit(processedFormData);
  };


  // --- Derived Data for Rendering ---

  // Get all available items/fixtures for display order dropdown
  const getAvailableDisplayItems = () => {
    return [...new Set([...formData.fixtures_, ...formData.items_])];
  };

  // Get properties relevant to the current type
  const currentProperties = propertySchemas[formData?.type] || [];

  // Get area options for exits - filtering by type='area'
  const areaOptions = (allItems || [])
    .filter(item => item?.type === 'area' && item?.id !== (formData?.id || ''))
    .map(item => item?.id || '')
    .filter(Boolean);

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">
        {isEditing ? `Edit ${formData?.type || 'item'}: ${formData?.name || formData?.id || ''}` : 'Create New Item'}
      </h2>

      {showTriggerForm ? (
        <TriggerForm
          trigger={currentTrigger}
          properties={propertySchemas[formData.type]}
          onSave={handleSaveTrigger}
          onCancel={() => setShowTriggerForm(false)}
        />
      ) : showInteractionForm ? (
        <InteractionForm
          interaction={currentInteraction}
          onSave={handleSaveInteraction}
          onCancel={() => setShowInteractionForm(false)}
        />
      ) : showDescriptionForm ? (
        <DescriptionForm
          description={formData.description_}
          onSave={handleSaveDescription}
          onCancel={() => setShowDescriptionForm(false)}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Type, ID, Name, Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">Type*</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className={`w-full p-2 border rounded ${errors.type ? 'border-red-500' : 'border-gray-300'}`}>
                {typeOptions.map(option => (<option key={option} value={option}>{option}</option>))}
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>
            <div>
              <label htmlFor="id" className="block text-sm font-medium mb-1">ID*</label>
              <input id="id" type="text" name="id" value={formData.id} onChange={handleChange} className={`w-full p-2 border rounded ${errors.id ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id}</p>}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name*</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Description</label>
              <button
                type="button"
                onClick={handleAddDescription}
                className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {formData.description_?.start || formData.description_?.end ? 'Edit Description' : 'Add Description'}
              </button>
            </div>
            
            {formData.description_?.start || formData.description_?.end ? (
              <div className="bg-gray-50 p-3 rounded">
                {formData.description_?.start && (
                  <div className="mb-2">
                    <span className="font-medium text-sm">Initial: </span>
                    <span className="text-sm">{formData.description_.start}</span>
                  </div>
                )}
                {formData.description_?.end && (
                  <div>
                    <span className="font-medium text-sm">End: </span>
                    <span className="text-sm">{formData.description_.end}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No description set</p>
            )}
          </div>

          {/* Container Description - only show for fixture and item types */}
          {(formData.type === 'fixture' || formData.type === 'item') && (
            <div className="mb-4">
              <label htmlFor="container_description" className="block text-sm font-medium mb-1">Container Description</label>
              <textarea
                id="container_description"
                name="container_description"
                value={formData.container_description || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows="3"
                placeholder="Description shown when the item is inside a container"
              />
            </div>
          )}

          {/* Fixtures, Items, Display Order Arrays */}
          <div className="mb-4">
             <label className="block text-sm font-medium mb-1">Fixtures</label>
             <div className="flex mb-2">
               <select className="flex-grow p-2 border border-gray-300 rounded-l" value={newFixture} onChange={(e) => setNewFixture(e.target.value)}>
                 <option value="">Select a fixture...</option>
                 {fixtureOptions.map(fixture => (<option key={fixture} value={fixture}>{fixture}</option>))}
               </select>
               <button type="button" onClick={() => { handleSelectOption('fixtures_', newFixture); setNewFixture(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">Add</button>
             </div>
             <div className="flex flex-wrap gap-2 mt-2">
               {formData.fixtures_.map((fixture, index) => (<div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm"><span>{fixture}</span><button type="button" onClick={() => removeFromArray('fixtures_', index)} className="ml-2 text-red-600 hover:text-red-800">×</button></div>))}
             </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Items</label>
            <div className="flex mb-2">
              <select className="flex-grow p-2 border border-gray-300 rounded-l" value={newItem} onChange={(e) => setNewItem(e.target.value)}>
                <option value="">Select an item...</option>
                {itemOptions.map(item => (<option key={item} value={item}>{item}</option>))}
              </select>
              <button type="button" onClick={() => { handleSelectOption('items_', newItem); setNewItem(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.items_.map((item, index) => (<div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm"><span>{item}</span><button type="button" onClick={() => removeFromArray('items_', index)} className="ml-2 text-red-600 hover:text-red-800">×</button></div>))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Display Order</label>
            <div className="flex mb-2">
              <select className="flex-grow p-2 border border-gray-300 rounded-l" value={newDisplayOrder} onChange={(e) => setNewDisplayOrder(e.target.value)}>
                <option value="">Select an item/fixture to display...</option>
                {getAvailableDisplayItems().map(item => (<option key={item} value={item}>{item}</option>))}
              </select>
              <button type="button" onClick={() => { handleSelectOption('display_order', newDisplayOrder); setNewDisplayOrder(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.display_order.length === 0 ? (<span className="text-gray-500 text-sm">Default display order. Add items/fixtures to control order.</span>) : (formData.display_order.map((item, index) => (<div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm"><span>{item}</span><button type="button" onClick={() => removeFromArray('display_order', index)} className="ml-2 text-red-600 hover:text-red-800">×</button></div>)))}
            </div>
          </div>

          {/* Properties Checkboxes */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Properties</label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {currentProperties.map(prop => (
                    <div key={prop.name} className="flex items-center">
                        <input type="checkbox" id={`prop-${prop.name}`} checked={!!formData.properties?.[prop.name]} onChange={(e) => handlePropertyChange(prop.name, e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" />
                        <label htmlFor={`prop-${prop.name}`} className="text-sm text-gray-700 select-none">{prop.label}</label>
                    </div>
                ))}
                {formData.type === 'fixture' && ( <div className="flex items-center text-gray-500"><input type="checkbox" checked={false} disabled className="h-4 w-4 border-gray-300 rounded mr-2 bg-gray-200" /><label className="text-sm select-none">Is Accessible (Fixed False)</label></div> )}
            </div>
            {currentProperties.length === 0 && formData.type && (<p className="text-sm text-gray-500 mt-1">No specific properties for type '{formData.type}'.</p>)}
          </div>

          {/* Exits field - only show for 'area' type */}
          {formData.type === 'area' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Exits (Connects to other Areas)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* North Exit */}
                <div>
                  <label htmlFor="exit-north" className="block text-sm text-gray-600 mb-1">North</label>
                  <select id="exit-north" value={exits.north} onChange={(e) => handleExitChange('north', e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                    <option value="">No exit</option>
                    {areaOptions.map(areaId => (
                      <option key={`north-${areaId}`} value={areaId}>{areaId}</option>
                    ))}
                  </select>
                </div>
                {/* South Exit */}
                <div>
                   <label htmlFor="exit-south" className="block text-sm text-gray-600 mb-1">South</label>
                   <select id="exit-south" value={exits.south} onChange={(e) => handleExitChange('south', e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                     <option value="">No exit</option>
                     {areaOptions.map(areaId => (
                       <option key={`south-${areaId}`} value={areaId}>{areaId}</option>
                     ))}
                   </select>
                 </div>
                {/* East Exit */}
                <div>
                   <label htmlFor="exit-east" className="block text-sm text-gray-600 mb-1">East</label>
                   <select id="exit-east" value={exits.east} onChange={(e) => handleExitChange('east', e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                     <option value="">No exit</option>
                     {areaOptions.map(areaId => (
                       <option key={`east-${areaId}`} value={areaId}>{areaId}</option>
                     ))}
                   </select>
                 </div>
                {/* West Exit */}
                <div>
                   <label htmlFor="exit-west" className="block text-sm text-gray-600 mb-1">West</label>
                   <select id="exit-west" value={exits.west} onChange={(e) => handleExitChange('west', e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                     <option value="">No exit</option>
                     {areaOptions.map(areaId => (
                       <option key={`west-${areaId}`} value={areaId}>{areaId}</option>
                     ))}
                   </select>
                 </div>
              </div>
               <p className="text-xs text-gray-500 mt-1">Select the ID of the area connected in each direction.</p>
               {areaOptions.length === 0 && <p className="text-xs text-orange-600 mt-1">No other area IDs found to link to. Create more areas first.</p>}
            </div>
          )}

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
                        <td className="px-3 py-2 text-sm text-gray-500">{interaction.message ? interaction.message.substring(0, 30) + (interaction.message.length > 30 ? "..." : "") : ""}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {interaction.is_repeatable ? "Yes" : "No"}
                        </td>
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

          {/* Triggers Management */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Triggers</label>
              <button
                type="button"
                onClick={handleAddTrigger}
                className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Add Trigger
              </button>
            </div>

            {triggersList.length === 0 ? (
              <p className="text-sm text-gray-500 mb-2">No triggers defined. Click 'Add Trigger' to create one.</p>
            ) : (
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {triggersList.map((trigger) => (
                      <tr key={trigger.key}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{trigger.key}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                          <button
                            type="button"
                            onClick={() => handleEditTrigger(trigger)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrigger(trigger.key)}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{isEditing ? 'Update Item' : 'Create Item'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ItemForm;