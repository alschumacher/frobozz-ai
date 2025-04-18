import React from 'react';

const ItemDetail = ({ item, onClose, onEdit }) => {
  if (!item) return null;

  // Helper function to render JSON objects
  const renderJsonField = (data) => {
    return (
      <pre className="bg-gray-50 p-3 rounded font-mono text-sm overflow-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Helper function to render arrays as tags
  const renderArrayField = (array) => {
    if (!array || array.length === 0) {
      return <p className="text-gray-500">None</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {array.map((item, index) => (
          <div key={index} className="bg-gray-100 rounded px-3 py-1 text-sm">
            {item}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Type</h3>
              <p>{item.type}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">ID</h3>
              <p>{item.id}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Name</h3>
              <p>{item.name}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-1">Description</h3>
            {item.description_ ? (
              <div className="space-y-2">
                {item.description_.start && (
                  <div>
                    <span className="font-medium text-sm">Initial: </span>
                    <span className="text-sm">{item.description_.start}</span>
                  </div>
                )}
                {item.description_.end && (
                  <div>
                    <span className="font-medium text-sm">End: </span>
                    <span className="text-sm">{item.description_.end}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No description provided</p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Display Order</h3>
              {renderArrayField(item.display_order)}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Fixtures</h3>
              {renderArrayField(item.fixtures_)}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Items</h3>
              {renderArrayField(item.items_)}
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Exits</h3>
              {Object.keys(item.exits_).length > 0 ?
                renderJsonField(item.exits_) :
                <p className="text-gray-500">No exits defined</p>
              }
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Properties</h3>
              {Object.keys(item.properties).length > 0 ?
                renderJsonField(item.properties) :
                <p className="text-gray-500">No properties defined</p>
              }
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Triggers</h3>
              {Object.keys(item.triggers).length > 0 ?
                renderJsonField(item.triggers) :
                <p className="text-gray-500">No triggers defined</p>
              }
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-1">Interactions</h3>
              {Object.keys(item.interactions).length > 0 ?
                renderJsonField(item.interactions) :
                <p className="text-gray-500">No interactions defined</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;