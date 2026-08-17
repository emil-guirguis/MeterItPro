import React from 'react';
import { UserManagementPage } from '../../features/users';

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

const AdminUsersPage: React.FC = () => {
  return <UserManagementPage authContext={allowedAuth} />;
};

export default AdminUsersPage;
