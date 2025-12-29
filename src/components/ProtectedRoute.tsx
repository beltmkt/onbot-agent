import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    isAuthenticated: boolean;
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    isAuthenticated,
    redirectPath = '/login',
}) => {
    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
};