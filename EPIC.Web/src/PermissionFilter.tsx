import React from "react";
import PermissionService from "./PermissionService";
import type { PermissionAction } from "./PermissionService";

interface PermissionFilterProps {
    module: string;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const PermissionFilter: React.FC<PermissionFilterProps> = ({
    module,
    action,
    children,
    fallback = null,
}) => {
    const allowed = PermissionService.hasPermission(
        module,
        action
    );

    if (!allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default PermissionFilter;