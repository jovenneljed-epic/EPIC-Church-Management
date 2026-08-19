import React, {
    useEffect,
    useState
} from "react";

import PermissionService from "./PermissionService";
import type {
    PermissionAction
} from "./PermissionService";

interface PermissionFilterProps {
    module: string;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const PermissionFilter: React.FC<
    PermissionFilterProps
> = ({
    module,
    action,
    children,
    fallback = null
}) => {

        const [allowed, setAllowed] =
            useState<boolean>(() =>
                PermissionService.hasPermission(
                    module,
                    action
                )
            );

        useEffect(() => {

            const checkPermission = () => {

                setAllowed(
                    PermissionService.hasPermission(
                        module,
                        action
                    )
                );
            };

            // Check immediately
            checkPermission();

            // Listen for permission changes
            window.addEventListener(
                "epic:permissions-changed",
                checkPermission
            );

            // Listen for login/logout changes
            window.addEventListener(
                "epic:auth-changed",
                checkPermission
            );

            return () => {

                window.removeEventListener(
                    "epic:permissions-changed",
                    checkPermission
                );

                window.removeEventListener(
                    "epic:auth-changed",
                    checkPermission
                );
            };

        }, [module, action]);

        if (!allowed) {
            return <>{fallback}</>;
        }

        return <>{children}</>;
    };

export default PermissionFilter;