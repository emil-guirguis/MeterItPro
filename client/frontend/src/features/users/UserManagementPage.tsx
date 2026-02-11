import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { User } from '../../types/auth';

export const UserManagementPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  return (
    <AppLayoutWrapper title="User Management">
      <div className="entity-management-page">
        <UserList
          onUserEdit={handleEdit}
          onUserCreate={handleCreate}
        />

        <FormModal
          isOpen={showForm}
          title="User"
          onClose={handleFormClose}
          showSaveButton={true}
          saveLabel="Save"
          size="md"
        >
          {showForm && (
            <UserForm
              key={selectedUser?.users_id ? `edit-${selectedUser.users_id}` : 'new'}
              user={selectedUser || undefined}
              onCancel={handleFormClose}
            />
          )}
        </FormModal>
      </div>
    </AppLayoutWrapper>
  );
};
