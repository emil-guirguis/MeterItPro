import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { SyncServerList } from './SyncServerList';
import { SyncServerForm } from './SyncServerForm';

const SyncServersPanel: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (server: any) => {
    setSelectedServer(server);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedServer(null);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedServer(null);
  };

  return (
    <div className="entity-management-page">
      <SyncServerList onEdit={handleEdit} onCreate={handleCreate} />

      <FormModal
        isOpen={showForm}
        title={selectedServer ? 'Edit Sync Server' : 'Add Sync Server'}
        onClose={handleClose}
        showSaveButton={true}
        saveLabel="Save"
        size="md"
      >
        {showForm && (
          <SyncServerForm
            key={selectedServer?.sync_server_id ? `edit-${selectedServer.sync_server_id}` : 'new'}
            server={selectedServer || undefined}
            onCancel={handleClose}
          />
        )}
      </FormModal>
    </div>
  );
};

export default SyncServersPanel;
