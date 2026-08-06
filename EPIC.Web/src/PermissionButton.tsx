import React, { useEffect, useState } from "react";
import PermissionService from "./PermissionService";

interface PermissionButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    module: string;
    action: "view" | "create" | "edit" | "delete" | "export";
    children: React.ReactNode;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
    module,
    action,
    children,
    ...buttonProps
}) => {

    const checkPermission = () => {

        switch (action) {

            case "view":
                return PermissionService.canView(module);

            case "create":
                return PermissionService.canCreate(module);

            case "edit":
                return PermissionService.canEdit(module);

            case "delete":
                return PermissionService.canDelete(module);

            case "export":
                return PermissionService.canExport(module);

            default:
                return false;
        }
    };

    const [hasPermission, setHasPermission] =
        useState<boolean>(checkPermission);

    useEffect(() => {

        const refreshPermission = () => {

            const allowed = checkPermission();

            console.log(
                `🔐 PermissionButton [${module}] [${action}]:`,
                allowed
            );

            setHasPermission(allowed);
        };

        // Check immediately
        refreshPermission();

        // Custom EPIC permission event
        window.addEventListener(
            "epic:permissions-changed",
            refreshPermission
        );

        // Browser storage event
        window.addEventListener(
            "storage",
            refreshPermission
        );

        return () => {

            window.removeEventListener(
                "epic:permissions-changed",
                refreshPermission
            );

            window.removeEventListener(
                "storage",
                refreshPermission
            );
        };

    }, [module, action]);

    /*
    ============================================================
    VIEW PERMISSION
    ============================================================
    */

    if (action === "view" && !hasPermission) {
        return null;
    }

    /*
    ============================================================
    BUTTON
    ============================================================
    */

    return (
        <button
            {...buttonProps}
            disabled={
                action !== "view"
                    ? !hasPermission ||
                    Boolean(buttonProps.disabled)
                    : buttonProps.disabled
            }
            title={
                !hasPermission
                    ? `You do not have ${action} permission for ${module}.`
                    : buttonProps.title
            }
        >
            {children}
        </button>
    );
};

export default PermissionButton;