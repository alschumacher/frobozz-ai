import React from 'react';

const ItemManager = ({ items, onSelect, onDelete }) => {
  return (
    <div className="overflow-y-auto h-[calc(100vh-250px)] pr-2">
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="group p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150 border border-gray-100"
            onClick={() => onSelect(item)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  item.type === 'area' ? 'bg-blue-500' :
                  item.type === 'item' ? 'bg-green-500' :
                  item.type === 'fixture' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-150 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {item.type}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this item?')) {
                    onDelete(item.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-150 p-1.5 rounded-full hover:bg-red-50 flex-shrink-0"
                title="Delete item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-4 text-center text-sm text-gray-500">
            No items found. Create your first item to get started.
          </li>
        )}
      </ul>
    </div>
  );
};

export default ItemManager; 