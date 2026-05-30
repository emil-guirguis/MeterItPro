import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import NotificationRulesList from './NotificationRulesList';
import NotificationRuleForm from './NotificationRuleForm';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import { notificationRuleService, type NotificationRule } from '../../services/notificationRuleService';

export const NotificationRulesPage: React.FC = () => {
  const rules = useNotificationRulesEnhanced();
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const handleCreate = () => {
    setSelectedRule(null);
    setShowForm(true);
  };

  const handleEdit = async (rule: NotificationRule) => {
    try {
      const detail = await notificationRuleService.getRule(rule.notification_rule_id);
      setSelectedRule(detail as any);
    } catch {
      setSelectedRule(rule);
    }
    setShowForm(true);
  };

  const handleFormSubmit = async () => {
    setShowForm(false);
    setSelectedRule(null);
    await rules.fetchItems();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedRule(null);
  };

  return (
    <div className="entity-management-page">
      <NotificationRulesList
        onRuleCreate={handleCreate}
        onRuleEdit={handleEdit}
      />

      <FormModal
        isOpen={showForm}
        title="Notification Rule"
        moduleIcon="notifications"
        crumb={selectedRule ? 'Edit' : 'New'}
        onClose={handleFormClose}
        showSaveButton={true}
        saveLabel="Save"
        size="lg"
      >
        {showForm && (
          <NotificationRuleForm
            key={selectedRule?.notification_rule_id ? `edit-${selectedRule.notification_rule_id}` : 'new'}
            rule={selectedRule || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            loading={false}
          />
        )}
      </FormModal>
    </div>
  );
};

export default NotificationRulesPage;
