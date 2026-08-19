import React from 'react';
import { CustomerList } from './CustomerList';

/** QuickBooks Customers — read-only viewer. No edit modal (source of truth is QB). */
export const CustomerManagementPage: React.FC = () => <CustomerList />;

export default CustomerManagementPage;
