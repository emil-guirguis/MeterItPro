import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import { OrderManagementPage } from '../features/orders/OrderManagementPage';
import { InventoryManagementPage } from '../features/inventory/InventoryManagementPage';
import { QuoteManagementPage } from '../features/quotes/QuoteManagementPage';
import { CustomerManagementPage } from '../features/customers/CustomerManagementPage';
import { UserManagementPage } from '../features/users/UserManagementPage';
import { useAuth } from '../hooks/useAuth';

export default function AppRoutes() {
  const { isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/orders" element={<OrderManagementPage />} />
      <Route path="/quotes" element={<QuoteManagementPage />} />
      <Route
        path="/inventory"
        element={isAdmin ? <InventoryManagementPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/customers"
        element={isAdmin ? <CustomerManagementPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/users"
        element={isAdmin ? <UserManagementPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
