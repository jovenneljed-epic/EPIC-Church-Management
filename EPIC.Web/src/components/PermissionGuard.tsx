import React from "react";
import { Navigate } from "react-router-dom";

interface PermissionGuardProps {
    module: string;
    action: string;
    children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
    module,
    action,
    children,
}) => {
    const permissionsRaw =
        localStorage.getItem("permissions");

    let permissions: Record<string, string[]> = {};

    try {
        permissions = permissionsRaw
            ? JSON.parse(permissionsRaw)
            : {};
    } catch {
        permissions = {};
    }

    const modulePermissions =
        permissions[module] || [];

    const allowed =
        modulePermissions.includes(action);

    if (!allowed) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

export default PermissionGuard;