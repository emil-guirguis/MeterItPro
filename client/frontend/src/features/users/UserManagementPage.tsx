import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import type { User } from '../../types/auth';

interface UserManagementPageProps {
  authContext?: { checkPermission: (p: any) => boolean; user: any };
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ authContext }) => (
  <EntityManagementPage<User>
    title="User"
    moduleIcon="users"
    renderList={({ onEdit, onCreate }) => (
      <UserList onUserEdit={onEdit} onUserCreate={onCreate} authContext={authContext} />
    )}
    renderForm={({ entity, onCancel }) => (
      <UserForm user={entity} onCancel={onCancel} />
    )}
  />
);
