import React, { useState, useCallback } from 'react';
import { AppLayoutWrapper as AppLayout } from '../../components/layout';
import { FormModal } from '@framework/components/modal';

import { UserList } from '../../features/users/UserList';
import { UserForm } from '../../features/users/UserForm';
import { useUsersEnhanced } from '../../features/users/usersStore';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { Permission } from '../../types/auth';
import './UserManagementPage.css';

export const UserManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const users = useUsersEnhanced();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.USER_CREATE);
  const canUpdate = checkPermission(Permission.USER_UPDATE);

  // Handle user editing
  const handleUserEdit = useCallback((user: User) => {
    if (!canUpdate) return;
    setSelectedUser(user);
    setShowEditModal(true);
  }, [canUpdate]);

  // Handle user creation
  const handleUserCreate = useCallback(() => {
    if (!canCreate) return;
    setSelectedUser(null);
    setShowCreateModal(true);
  }, [canCreate]);

  // Handle form submission for creating user
  const handleCreateSubmit = useCallback(async (userData: Partial<User>) => {
    try {
      await users.createUser(userData);
      setShowCreateModal(false);
      setSelectedUser(null);
    } catch (error) {
      // Error is handled by the store and displayed in the form
      throw error;
    }
  }, [users]);

  // Handle form submission for updating user
  const handleUpdateSubmit = useCallback(async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      // Use _id if id is not available (legacy compatibility)
      const userId = selectedUser.users_id || (selectedUser as any)._id;
      await users.updateUser(userId, userData);
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      // Error is handled by the store and displayed in the form
      throw error;
    }
  }, [selectedUser, users]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
  }, []);

  // Breadcrumb configuration
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/users' },
  ];

  return (
    <AppLayout 
      title="User Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="user-management-page">
        <UserList
          onUserEdit={handleUserEdit}
          onUserCreate={handleUserCreate}
        />

        {/* Create User Modal */}
        <FormModal
          isOpen={showCreateModal}
          title="Create New User"
          onClose={handleModalClose}
          onSubmit={handleCreateSubmit}
          loading={users.loading}
          error={users.error || undefined}
          size="lg"
          showSaveButton={true}
        >
          <UserForm
            onSubmit={handleCreateSubmit}
            onCancel={handleModalClose}
          />
        </FormModal>

        {/* Edit User Modal */}
        <FormModal
          isOpen={showEditModal}
          title={`Edit User: ${selectedUser?.name || ''}`}
          data={selectedUser || undefined}
          onClose={handleModalClose}
          onSubmit={handleUpdateSubmit}
          loading={users.loading}
          error={users.error || undefined}
          size="lg"
          showSaveButton={true}
        >
          <UserForm
            user={selectedUser || undefined}
            onSubmit={handleUpdateSubmit}
            onCancel={handleModalClose}
          />
        </FormModal>

        {/* View User Modal */}
        <FormModal
          isOpen={showViewModal}
          title={`User Details: ${selectedUser?.name || ''}`}
          onClose={handleModalClose}
          onSubmit={() => Promise.resolve()}
          size="md"
        >
          <UserDetails user={selectedUser} onEdit={() => {
            setShowViewModal(false);
            handleUserEdit(selectedUser!);
          }} />
        </FormModal>
      </div>
    </AppLayout>
  );
};

// User Details Component for View Modal
interface UserDetailsProps {
  user: User | null;
  onEdit: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, onEdit }) => {
  const { checkPermission } = useAuth();
  const canUpdate = checkPermission(Permission.USER_UPDATE);

  if (!user) return null;

  return (
    <div className="user-details">
      <div className="user-details__section">
        <h3 className="user-details__section-title">Basic Information</h3>
        <div className="user-details__grid">
          <div className="user-details__field">
            <label className="user-details__label">Name</label>
            <span className="user-details__value">{user.name}</span>
          </div>
          <div className="user-details__field">
            <label className="user-details__label">Email</label>
            <span className="user-details__value">{user.email}</span>
          </div>
          <div className="user-details__field">
            <label className="user-details__label">Role</label>
            <span className={`user-details__role user-details__role--${user.role}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <div className="user-details__field">
            <label className="user-details__label">Status</label>
            <span className={`user-details__status user-details__status--${user.active}`}>
              {user.active  ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="user-details__section">
        <h3 className="user-details__section-title">Account Information</h3>
        <div className="user-details__grid">
          <div className="user-details__field">
            <label className="user-details__label">Last Login</label>
            <span className="user-details__value">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="user-details__field">
            <label className="user-details__label">Created</label>
            <span className="user-details__value">
              {new Date(user.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="user-details__field">
            <label className="user-details__label">Last Updated</label>
            <span className="user-details__value">
              {new Date(user.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="user-details__section">
        <h3 className="user-details__section-title">Permissions</h3>
        <div className="user-details__permissions">
          {user.permissions.length > 0 ? (
            <div className="user-details__permission-list">
              {user.permissions.map(permission => (
                <span key={permission} className="user-details__permission">
                  {permission.replace(':', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          ) : (
            <span className="user-details__no-permissions">No specific permissions assigned</span>
          )}
        </div>
      </div>

      {canUpdate && (
        <div className="user-details__actions">
          <button
            type="button"
            onClick={onEdit}
            className="user-details__edit-btn"
          >
            ✏️ Edit User
          </button>
        </div>
      )}
    </div>
  );
};