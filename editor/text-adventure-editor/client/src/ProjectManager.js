import React, { useState } from 'react';
import ExportSettings from './ExportSettings';

const ProjectManager = ({ projects, onDeleteProject, onExport, onClose }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showExportSettings, setShowExportSettings] = useState(false);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setShowExportSettings(false);
  };

  const handleExport = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    onExport(selectedProject.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Project Manager</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Project Management</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              onChange={(e) => {
                const project = projects.find(p => p.id === parseInt(e.target.value));
                handleProjectSelect(project);
              }}
              value={selectedProject?.id || ''}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => onDeleteProject(selectedProject.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Project
                </button>
                <button
                  onClick={() => setShowExportSettings(!showExportSettings)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {showExportSettings ? 'Hide Export Settings' : 'Show Export Settings'}
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Export Project
                </button>
              </div>

              {showExportSettings && (
                <ExportSettings
                  projectId={selectedProject.id}
                  onSave={() => {
                    // Refresh the project list or show a success message
                    alert('Export settings saved successfully');
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManager; 