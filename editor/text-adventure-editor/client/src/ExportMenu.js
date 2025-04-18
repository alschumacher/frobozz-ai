import React, { useState } from 'react';

const ExportMenu = ({ items, gameState, onExport, onClose }) => {
  const [startArea, setStartArea] = useState(gameState.start_area || '');

  const handleExport = () => {
    onExport(startArea, gameState);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Game</h2>
              <p className="mt-1 text-sm text-gray-500">Export your game data to a JSON file</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-150 p-1 rounded-full hover:bg-gray-100"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Area
              </label>
              <select
                value={startArea}
                onChange={(e) => setStartArea(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 text-sm"
              >
                <option value="">Select a start area</option>
                {items
                  .filter(item => item.type === 'area')
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              {!startArea && (
                <p className="mt-1 text-sm text-red-500">
                  Please select a start area to export
                </p>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!startArea}
                  className={`px-4 py-2 text-white rounded-lg transition-colors duration-150 flex items-center space-x-2 text-sm font-medium ${
                    startArea
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportMenu; 