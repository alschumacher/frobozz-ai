import React, { useState } from 'react';
import CrudApp from './CrudApp';
import ItemDetail from './ItemDetail';

function App() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedItem(null);
  };

  const handleEditFromDetail = (item) => {
    // This would be implemented to show the edit form
    setShowDetail(false);
    // Logic to show edit form would go here
  };

  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">CRUD Application</h1>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <CrudApp onViewItem={handleViewItem} />

        {showDetail && (
          <ItemDetail
            item={selectedItem}
            onClose={handleCloseDetail}
            onEdit={handleEditFromDetail}
          />
        )}
      </main>
    </div>
  );
}

export default App;