import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LocalDashboard from './pages/LocalDashboard';
import SystemStatusPage from './pages/SystemStatusPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/sync-status" replace />} />
        <Route path="dashboard" element={<LocalDashboard />} />
        <Route path="sync-status" element={<SystemStatusPage />} />
      </Route>
    </Routes>
  );
}

export default App;
