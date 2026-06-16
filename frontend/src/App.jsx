import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import FeedbackForm from './pages/FeedbackForm';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  
  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={!user ? <Login /> : (user.role === 'landlord' ? <Navigate to="/landlord" /> : <Navigate to="/tenant" />)} />
        <Route path="/tenant" element={
          <ProtectedRoute allowedRole="tenant">
            <TenantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/landlord" element={
          <ProtectedRoute allowedRole="landlord">
            <LandlordDashboard />
          </ProtectedRoute>
        } />
        <Route path="/feedback/:propertyId" element={
          <ProtectedRoute allowedRole="tenant">
            <FeedbackForm />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
