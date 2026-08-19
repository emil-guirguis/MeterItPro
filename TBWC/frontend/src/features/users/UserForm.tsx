import React from 'react';
import { BaseForm } from '@meterit/framework-frontend/components/form';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';

interface UserFormProps {
  user?: User;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Schema-driven user form. BaseForm fetches the `user` schema (GET /api/schema/user)
 * and renders + validates every field; the store handles create/update via REST.
 */
export const UserForm: React.FC<UserFormProps> = ({ user, onCancel, loading = false }) => {
  const users = useUsersEnhanced();

  return (
    <BaseForm
      schemaName="user"
      entity={user}
      store={users}
      onCancel={onCancel}
      className="user-form"
      loading={loading}
      showTabs={true}
    />
  );
};

export default UserForm;
