import React, { useState } from 'react';
import { FormModal } from '@framework/components/modal';
import NotificationRulesList from './NotificationRulesList';
import NotificationRuleForm from './NotificationRuleForm';
import { useNotificationRulesEnhanced } from './notificationRulesStore';
import type { NotificationRule } from '../../services/notificationRuleService';

export const NotificationRulesPage: React.FC = () => {
  const rules = useNotificationRulesEnhanced();
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCreate = () => {
    setSelectedRule(null);
    setShowForm(true);
  };

  const handleEdit = (rule: NotificationRule) => {
    setSelectedRule(rule);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedRule) {
        await rules.updateItem(selectedRule.notification_rule_id, data);
      } else {
        await rules.createItem(data);
      }
      setShowForm(false);
      setSelectedRule(null);
      await rules.fetchItems();
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
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
        title={selectedRule ? 'Edit Notification Rule' : 'Create Notification Rule'}
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
            loading={isSubmitting}
          />
        )}
      </FormModal>
    </div>
  );
};

export default NotificationRulesPage;
