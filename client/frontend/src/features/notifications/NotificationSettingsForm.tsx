import React, { useEffect, useMemo } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { useNotificationsEnhanced } from './notificationsStore';

export const NotificationSettingsForm: React.FC = () => {
  const notifications = useNotificationsEnhanced();

  useEffect(() => {
    notifications.fetchSettings();
  }, []);

  // Adapter so BaseForm can call updateItem/createItem — both delegate to updateSettings (UPSERT)
  const settingsStore = useMemo(() => ({
    ...notifications,
    updateItem: async (_id: string, data: Record<string, unknown>) => {
      await notifications.updateSettings(data as any);
      return { ...(notifications.settings ?? {}), ...data };
    },
    createItem: async (data: Record<string, unknown>) => {
      await notifications.updateSettings(data as any);
      return data;
    },
  }), [notifications]);

  return (
    <FormContainer>
      <div className="form-container__content">
        <BaseForm
          schemaName="notification_settings"
          entity={notifications.settings}
          store={settingsStore}
          onCancel={() => {}}
          loading={notifications.settingsLoading}
          showTabs={false}
        />
      </div>
    </FormContainer>
  );
};

export default NotificationSettingsForm;
