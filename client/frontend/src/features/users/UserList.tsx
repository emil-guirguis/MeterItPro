import React, { useMemo } from 'react';
import { BaseList } from '@framework/components/list';
import { useUsersEnhanced } from './usersStore';
import { useBaseList } from '@framework/components/list/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { User } from '../../types/auth';
import { Permission } from '../../types/auth';
import {
  userStats,
  createUserBulkActions,
  userExportConfig,
} from './userConfig';
import { showConfirmation } from '@framework/utils/confirmationHelper';
import './UserList.css';

interface UserListProps {
  onUserEdit?: (user: User) => void;
  onUserCreate?: () => void;
  authContext?: { checkPermission: (p: any) => boolean; user: any };
}

export const UserList: React.FC<UserListProps> = ({
  onUserEdit,
  onUserCreate,
  authContext: authContextProp,
}) => {
  const users = useUsersEnhanced();
  const realAuth = useAuth();
  const auth = authContextProp ?? realAuth;
  const { schema } = useSchema('user');

  // Generate columns and filters from schema (same pattern as ContactList)
  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<User>(schema.formFields, {
      fieldOrder: ['name', 'email', 'phone', 'role', 'active'],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields);
  }, [schema]);

  const handleUserDelete = (user: User) => {
    showConfirmation({
      type: 'warning',
      title: 'Inactivate User',
      message: `Inactivate user "${user.name}"?`,
      confirmText: 'Inactivate',
      onConfirm: async () => {
        //bawait users.updateItem(user.id, { active: 'inactive' });
        await users.fetchItems();
      }
    });
  };

  const baseList = useBaseList<User, any>({
    entityName: 'user',
    entityNamePlural: 'users',
    useStore: useUsersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.USER_CREATE,
      update: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
    },
    columns,
    filters,
    stats: userStats,
    bulkActions: createUserBulkActions(
      { bulkUpdateStatus: async (ids: string[], status: string) => {
        await users.bulkUpdateStatus(ids, status as 'active' | 'inactive');
      }},
      (items) => baseList.handleExport(items)
    ),
    export: userExportConfig,
    onEdit: onUserEdit,
    onCreate: onUserCreate,
    authContext: auth,
  });

  return (
    <div className="user-list">
      <BaseList
        title="Users"
        filters={baseList.renderFilters()}
        onCreateClick={baseList.canCreate ? baseList.handleCreate : undefined}
        onExportClick={baseList.canExport ? () => baseList.handleExport(baseList.data) : undefined}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No users found. Create your first user to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleUserDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
