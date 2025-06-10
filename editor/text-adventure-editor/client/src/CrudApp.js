import React, { useState, useEffect } from 'react';
import ItemForm from './ItemForm';
import ItemDetail from './ItemDetail';
import ExportSettingsForm from './ExportSettingsForm';

const API_URL = 'http://localhost:3001/api';

const CrudApp = () => {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showExportSettings, setShowExportSettings] = useState(false);

  // Fetch all items from the API
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch items');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get area IDs for export settings
  const getAreaOptions = () => {
    return items
      .filter(item => item.type === 'area')
      .map(item => item.id);
  };

  // Export all items with settings
  const handleExport = async (projectId, formData, action = 'export') => {
    try {
      if (action === 'save') {
        // Save export settings
        const saveResponse = await fetch(`${API_URL}/projects/${projectId}/export-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save export settings');
        }
        
        alert('Export settings saved successfully');
        return;
      }

      // Perform export
      const response = await fetch(`${API_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error('Failed to export items');
      }
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'items_export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      console.error('Error handling export:', err);
    }
  };

  // Create a new item
  const createItem = async (item) => {
    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      await fetchItems(); // Refresh the items list
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create item');
      console.error(err);
    }
  };

  // Update an existing item
  const updateItem = async (item) => {
    try {
      const response = await fetch(`${API_URL}/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      await fetchItems(); // Refresh the items list
      setShowForm(false);
      setCurrentItem(null);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  // Delete an item
  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      await fetchItems(); // Refresh the items list
      setError(null);
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  // Save item (handles both create and update)
  const saveItem = async (item) => {
    if (isEditing) {
      await updateItem(item);
    } else {
      await createItem(item);
    }
  };

  // Handle edit button click
  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditing(true);
    setShowForm(true);
    setShowDetail(false);
  };

  // Handle create button click
  const handleCreate = () => {
    setCurrentItem(null);
    setIsEditing(false);
    setShowForm(true);
    setShowDetail(false);
  };

  // Handle view item click
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    setShowForm(false);
  };

  // Close detail view
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
  };

  // Get all available fixtures and items for dropdowns
  const getFixtureOptions = () => {
    return items
      .filter(item => item.type === 'fixture')
      .map(item => item.id);
  };

  const getItemOptions = () => {
    return items
      .filter(item => item.type === 'item')
      .map(item => item.id);
  };

  // Fetch items when component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  if (isLoading && items.length === 0) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Item Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create New Item
          </button>
          <button
            onClick={() => setShowExportSettings(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export All Items
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm ? (
        <ItemForm
          initialData={currentItem}
          onSubmit={saveItem}
          isEditing={isEditing}
          onCancel={() => setShowForm(false)}
          fixtureOptions={getFixtureOptions()}
          itemOptions={getItemOptions()}
          allItems={items} // Pass all items to ItemForm
        />
      ) : showDetail && selectedItem ? (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
        />
      ) : (
        <>
          {items.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded">
              No items found. Create your first item!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-gray-300 hover:bg-gray-50">
                      <td className="px-4 py-2">{item.type}</td>
                      <td className="px-4 py-2">{item.id}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.description_?.start || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewItem(item)}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showExportSettings && (
        <ExportSettingsForm
          areas={getAreaOptions()}
          items={items}
          onSubmit={handleExport}
          onCancel={() => setShowExportSettings(false)}
          projectId={selectedProjectId}
        />
      )}

      {showProjectManager && (
        <ProjectManager
          projects={projects}
          onDeleteProject={handleDeleteProject}
          onExport={handleExport}
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </div>
  );
};

export default CrudApp;