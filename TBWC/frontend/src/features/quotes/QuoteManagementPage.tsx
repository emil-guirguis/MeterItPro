import React from 'react';
import { EntityManagementPage } from '@meterit/framework-frontend/components/entity';
import { QuoteList } from './QuoteList';
import { QuoteForm } from './QuoteForm';
import type { Quote } from '../../types/quote';

export const QuoteManagementPage: React.FC = () => (
  <EntityManagementPage<Quote>
    title="Quote"
    moduleIcon="quotes"
    modalSize="xl"
    renderList={({ onEdit, onCreate }) => (
      <QuoteList onQuoteEdit={onEdit} onQuoteCreate={onCreate} />
    )}
    renderForm={({ entity, onCancel }) => <QuoteForm quote={entity} onCancel={onCancel} />}
  />
);

export default QuoteManagementPage;
