import React from 'react';
import { Role } from '../../types/index.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface PermissionGateProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ roles, children, fallback = null }) => {
  const { hasRole } = useAuth();

  if (!hasRole(...roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
