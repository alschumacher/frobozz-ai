import React, { useState, useEffect } from 'react';

const StateEventEditor = ({ projectId, onClose }) => {
  const [stateEvents, setStateEvents] = useState({});
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStateEvents();
  }, [projectId]);

  const fetchStateEvents = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${Number(projectId)}/state-events`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch state events');
      }
      const data = await response.json();
      setStateEvents(data.state_events || {});
      setJsonText(JSON.stringify(data.state_events || {}, null, 2));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching state events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate JSON before saving
      const parsedJson = JSON.parse(jsonText);
      
      const response = await fetch(`http://localhost:3001/api/projects/${Number(projectId)}/state-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state_events: parsedJson }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save state events');
      }

      setStateEvents(parsedJson);
      setError(null);
      alert('State events saved successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error saving state events:', err);
    }
  };

  const handleJsonChange = (e) => {
    setJsonText(e.target.value);
    setError(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">State Event Editor</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Edit state events in JSON format. The structure should be:
          </div>
          <pre className="bg-gray-100 p-2 mt-2 rounded">
            {`{
  "event_name": {
    "artifacts": {
      "artifact_id": {
        "property": "value"
      }
    },
    "events": {
      "event_name": true/false
    },
    "event_value": true/false
  }
}`}
          </pre>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            className="w-full h-96 p-2 border border-gray-300 rounded font-mono text-sm"
            placeholder="Enter state events in JSON format..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save State Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default StateEventEditor; 