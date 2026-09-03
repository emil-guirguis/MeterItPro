import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import type { User } from '../../types/auth';

export const UserManagementPage: React.FC = () => (
  <EntityManagementPage<User>
    title="User"
    moduleIcon="users"
    editLabel={(u) => [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'User'}
    renderList={({ onEdit, onCreate }) => (
      <UserList onUserEdit={onEdit} onUserCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => <UserForm user={entity} onCancel={onCancel} />}
  />
);

export default UserManagementPage;
