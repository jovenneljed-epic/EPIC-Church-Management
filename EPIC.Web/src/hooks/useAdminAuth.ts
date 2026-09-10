import { useState, useCallback, useEffect } from "react";
import permissionService from "../PermissionService";
import { login } from "../auth/authService";

export type UserRole = "ADMIN" | "MEMBER";

const ADMIN_SESSION_KEYS = [
    "epic_admin_verified",
    "epic_community_admin_verified"
];

export function checkIsAdminVerified(): boolean {
    if (typeof window === "undefined") return false;
    for (const key of ADMIN_SESSION_KEYS) {
        if (sessionStorage.getItem(key) === "true") return true;
    }
    return permissionService.isAdministrator();
}

export function useAdminAuth() {
    const [userRole, setUserRole] = useState<UserRole>(() => {
        return checkIsAdminVerified() ? "ADMIN" : "MEMBER";
    });

    const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
    const [adminAuthError, setAdminAuthError] = useState<string>("");
    const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(false);
    const [toastNotification, setToastNotification] = useState<string>("");

    // Sync across window events if role changes in another component/tab
    useEffect(() => {
        const handleStorage = () => {
            if (checkIsAdminVerified()) {
                setUserRole("ADMIN");
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const showToast = useCallback((msg: string, duration = 3500) => {
        setToastNotification(msg);
        setTimeout(() => setToastNotification(""), duration);
    }, []);

    const handleRequestAdminMode = useCallback(() => {
        if (userRole === "ADMIN") {
            setUserRole("MEMBER");
            ADMIN_SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
            showToast("Switched to Church Member view.");
        } else {
            if (permissionService.isAdministrator()) {
                setUserRole("ADMIN");
                sessionStorage.setItem("epic_admin_verified", "true");
                showToast("👑 Administrator privileges verified via EPIC CMS session.");
            } else {
                setAdminAuthError("");
                setIsAdminAuthModalOpen(true);
            }
        }
    }, [userRole, showToast]);

    const handleAdminLogin = useCallback(
        async (u: string, p: string): Promise<boolean> => {
            setAdminAuthError("");
            setAdminAuthLoading(true);

            const user = u.trim();
            const pass = p.trim();

            // 1. Master Passcode or SuperAdmin Override
            if (
                pass === "epic2026" ||
                pass === "admin123" ||
                (user.toLowerCase() === "admin" && (pass === "epic" || pass === "admin"))
            ) {
                setUserRole("ADMIN");
                sessionStorage.setItem("epic_admin_verified", "true");
                setIsAdminAuthModalOpen(false);
                setAdminAuthLoading(false);
                showToast("👑 Administrator access verified! Moderation controls unlocked.");
                return true;
            }

            // 2. Real Backend Authentication via EPIC CMS login()
            try {
                const res = await login(user, pass);
                if (
                    permissionService.isAdministrator() ||
                    res.role?.toLowerCase().includes("admin") ||
                    res.roleId === 1
                ) {
                    setUserRole("ADMIN");
                    sessionStorage.setItem("epic_admin_verified", "true");
                    setIsAdminAuthModalOpen(false);
                    showToast(`👑 Welcome, ${res.fullName || res.username}! Moderation controls unlocked.`);
                    return true;
                } else {
                    setAdminAuthError("Access denied: Your account does not have Administrator privileges in EPIC CMS.");
                    return false;
                }
            } catch (err: any) {
                setAdminAuthError(err.message || "Invalid administrator credentials. Please verify username and password.");
                return false;
            } finally {
                setAdminAuthLoading(false);
            }
        },
        [showToast]
    );

    const closeAdminAuthModal = useCallback(() => {
        setIsAdminAuthModalOpen(false);
        setAdminAuthError("");
    }, []);

    return {
        userRole,
        isAdmin: userRole === "ADMIN",
        isAdminAuthModalOpen,
        adminAuthError,
        adminAuthLoading,
        toastNotification,
        handleRequestAdminMode,
        handleAdminLogin,
        closeAdminAuthModal,
        showToast,
        setToastNotification
    };
}
