import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseList } from '@framework/components/list/BaseList';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import { useSupportTicketsEnhanced, type SupportTicket } from './supportTicketsStore';
import { useAuth } from '../hooks/useAuth';

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

interface SupportTicketListProps {
  onCreate?: () => void;
}

export const SupportTicketList: React.FC<SupportTicketListProps> = ({ onCreate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminSupport = user?.is_support_admin === true;
  const { schema } = useSchema('support_ticket');

  const columns = useMemo(() => {
    if (!schema) return [];
    const fieldOrder = isAdminSupport
      ? ['title', 'client_tenant_name', 'type', 'status', 'priority', 'assigned_to_name', 'created_at']
      : ['title', 'type', 'status', 'priority', 'created_at'];
    return generateColumnsFromSchema<SupportTicket>(schema.formFields, { fieldOrder, responsive: 'hide-mobile' });
  }, [schema, isAdminSupport]);

  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields, {
      fieldOrder: ['status', 'priority', 'type'],
    });
  }, [schema]);

  const baseList = useBaseList<SupportTicket, ReturnType<typeof useSupportTicketsEnhanced>>({
    entityName: 'support_ticket',
    entityNamePlural: 'support tickets',
    useStore: useSupportTicketsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: false,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: true,
      allowFilters: true,
    },
    columns,
    filters,
    onEdit: (ticket) => navigate(`/support/tickets/${ticket.support_ticket_id}`),
    onCreate,
    authContext: allowedAuth,
  });

  return (
    <BaseList
      title="Support Tickets"
      filters={baseList.renderFilters()}
      onCreateClick={onCreate}
      data={baseList.data}
      columns={baseList.columns}
      loading={baseList.loading}
      error={baseList.error}
      emptyMessage="No tickets found."
      onRowClick={(ticket) => navigate(`/support/tickets/${ticket.support_ticket_id}`)}
      pagination={baseList.pagination}
    />
  );
};
