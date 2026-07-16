import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './Spinner';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Authenticating..." />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking permissions..." />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function FacultyRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking permissions..." />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile?.role !== 'faculty' && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
