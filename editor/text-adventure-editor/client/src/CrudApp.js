import React, { useState, useEffect } from 'react';
import ItemForm from './ItemForm';
import ItemDetail from './ItemDetail';
import ExportSettingsForm from './ExportSettingsForm';
import ProjectManager from './ProjectManager';

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
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedProjectForAssignment, setSelectedProjectForAssignment] = useState('');

  // Fetch projects from the API
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Fetch items from the API
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const url = selectedProjectId 
        ? `${API_URL}/items?project_id=${selectedProjectId}`
        : `${API_URL}/items`;
      const response = await fetch(url);
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
  const handleExport = async (projectId) => {
    try {
      const response = await fetch(`${API_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export project');
      }

      const data = await response.json();
      
      // Create a download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_export_${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      console.error('Error exporting project:', err);
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

  // Add function to handle checkbox selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Add function to handle adding items to project
  const addItemsToProject = async (projectId) => {
    if (selectedItems.size === 0) {
      alert('Please select items to add to the project');
      return;
    }

    try {
      console.log('Sending request with:', {
        item_ids: Array.from(selectedItems),
        project_id: projectId
      });

      const response = await fetch(`${API_URL}/items/assign-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_ids: Array.from(selectedItems),
          project_id: projectId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign items to project');
      }

      // Refresh the items list to show updated project assignments
      await fetchItems();
      // Clear selections
      setSelectedItems(new Set());
      setSelectedProjectForAssignment('');
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error assigning items to project:', err);
    }
  };

  // Add function to handle project deletion
  const handleDeleteProject = async (projectId) => {
    if (!projectId) {
      setError('Invalid project ID');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.text();
        throw new Error(`Failed to delete project: ${data}`);
      }

      // Refresh projects list
      await fetchProjects();
      
      // If we were viewing the deleted project's items, switch to all items
      if (selectedProjectId === projectId.toString()) {
        setSelectedProjectId('');
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    }
  };

  // Add function to handle project creation
  const handleCreateProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const newProject = await response.json();
      console.log('Created project:', newProject); // Debug log

      if (!newProject.id && !newProject.rowid) {
        throw new Error('Project created but no ID returned');
      }

      await fetchProjects();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error creating project:', err);
    }
  };

  // Fetch items and projects when component mounts
  useEffect(() => {
    fetchItems();
    fetchProjects();
  }, [selectedProjectId]);

  const handleProjectChange = (updatedItem) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  if (isLoading && items.length === 0) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border rounded p-2"
          >
            <option key="all" value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowProjectManager(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Projects
          </button>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Project
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create New Item
          </button>
        </div>
        <div className="flex items-center gap-4">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('Select onChange - value:', value);
                  console.log('Select onChange - type:', typeof value);
                  setSelectedProjectForAssignment(value);
                }}
                value={selectedProjectForAssignment}
                className="border rounded p-2"
              >
                <option key="default" value="">Select Project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedProjectForAssignment) {
                    console.log('Selected project ID:', selectedProjectForAssignment);
                    console.log('Available projects:', projects);
                    const selectedProject = projects.find(p => p.id === parseInt(selectedProjectForAssignment));
                    console.log('Found project:', selectedProject);
                    if (!selectedProject) {
                      setError('Selected project not found');
                      return;
                    }
                    addItemsToProject(selectedProject.id);
                  } else {
                    alert('Please select a project first');
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!selectedProjectForAssignment}
              >
                Add to Project
              </button>
              <button
                onClick={() => {
                  setSelectedItems(new Set());
                  setSelectedProjectForAssignment('');
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          )}
          <button
            onClick={() => setShowExportSettings(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Items
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
          allItems={items}
        />
      ) : showDetail && selectedItem ? (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          onProjectChange={handleProjectChange}
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
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(new Set(items.map(item => item.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                        checked={selectedItems.size === items.length && items.length > 0}
                      />
                    </th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Project</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-gray-300 hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                        />
                      </td>
                      <td className="px-4 py-2">{item.type}</td>
                      <td className="px-4 py-2">{item.id}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.description_?.start || '-'}</td>
                      <td className="px-4 py-2">
                        {item.project_id ? (
                          projects.find(p => p.id === item.project_id)?.name || 'Unknown Project'
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
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