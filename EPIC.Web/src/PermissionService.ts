// ============================================================
// EPIC CHURCH MANAGEMENT SYSTEM
// PermissionService.ts
// ============================================================

export type PermissionAction =
    | "view"
    | "create"
    | "edit"
    | "delete"
    | "export";

export interface Permission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
}

// ============================================================
// AVAILABLE EPIC MODULES
// ============================================================

export const EPIC_PERMISSION_MODULES = [
    "Dashboard",
    "Members",
    "Attendance",
    "Visitors",
    "Church Services",
    "Giving",
    "Income",
    "Expenses",
    "Ministries",
    "Events",
    "Reports",
    "Settings",
    "Demo Requests",
    "Subscriptions",
    "EPIC Learning"
] as const;

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEYS = {
    permissions: "permissions",

    currentUser: "currentUser",
    username: "username",

    currentFullName: "currentFullName",
    fullName: "fullName",

    currentRole: "currentRole",
    role: "role",

    currentRoleId: "currentRoleId",
    roleId: "roleId"
} as const;

// ============================================================
// PERMISSION SERVICE
// ============================================================

class PermissionService {

    // ============================================================
    // NORMALIZE MODULE
    // ============================================================

    private normalizeModule(
        module: unknown
    ): string {

        return String(module ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    // ============================================================
    // NORMALIZE ACTION
    // ============================================================

    private normalizeAction(
        action: unknown
    ): PermissionAction | null {

        const normalized =
            String(action ?? "")
                .trim()
                .toLowerCase();

        switch (normalized) {

            case "view":
                return "view";

            case "create":
                return "create";

            case "edit":
            case "update":
                return "edit";

            case "delete":
            case "remove":
                return "delete";

            case "export":
                return "export";

            default:
                return null;
        }
    }

    // ============================================================
    // BOOLEAN PARSER
    // ============================================================

    private toBoolean(
        value: unknown
    ): boolean {

        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "number") {
            return value === 1;
        }

        if (typeof value === "string") {

            switch (
                value.trim().toLowerCase()
            ) {

                case "true":
                case "1":
                case "yes":
                case "y":
                    return true;

                default:
                    return false;
            }
        }

        return false;
    }

    // ============================================================
    // CURRENT USER
    // ============================================================

    getCurrentUser(): string {

        return (
            localStorage.getItem(
                STORAGE_KEYS.currentUser
            ) ||
            localStorage.getItem(
                STORAGE_KEYS.username
            ) ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT FULL NAME
    // ============================================================

    getCurrentFullName(): string {

        return (
            localStorage.getItem(
                STORAGE_KEYS.currentFullName
            ) ||
            localStorage.getItem(
                STORAGE_KEYS.fullName
            ) ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT ROLE
    // ============================================================

    getCurrentRole(): string {

        return (
            localStorage.getItem(
                STORAGE_KEYS.currentRole
            ) ||
            localStorage.getItem(
                STORAGE_KEYS.role
            ) ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT ROLE ID
    // ============================================================

    getCurrentRoleId(): number | null {

        const value =
            localStorage.getItem(
                STORAGE_KEYS.currentRoleId
            ) ||
            localStorage.getItem(
                STORAGE_KEYS.roleId
            );

        if (!value) {
            return null;
        }

        const roleId = Number(value);

        return Number.isFinite(roleId)
            ? roleId
            : null;
    }

    // ============================================================
    // NORMALIZED ROLE
    // ============================================================

    private getNormalizedRole(): string {

        return this.getCurrentRole()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    // ============================================================
    // ADMINISTRATOR CHECK
    // ============================================================

    isAdministrator(): boolean {

        const role =
            this.getNormalizedRole();

        return [
            "admin",
            "administrator",
            "system administrator",
            "super admin",
            "superadmin"
        ].includes(role);
    }

    // ============================================================
    // MEMBER CHECK
    //
    // INFORMATIONAL ONLY.
    //
    // Member status does NOT automatically deny permissions.
    // ============================================================

    isMemberOnly(): boolean {

        const role =
            this.getNormalizedRole();

        const username =
            this.getCurrentUser()
                .trim()
                .toLowerCase();

        const roleId =
            this.getCurrentRoleId();

        return (
            role === "member" ||
            role === "members" ||
            role === "member only" ||
            role === "memberonly" ||
            roleId === 4 ||
            username === "memberonly"
        );
    }

    // ============================================================
    // GET RAW STORED PERMISSIONS
    // ============================================================

    getPermissions(): unknown[] {

        const stored =
            localStorage.getItem(
                STORAGE_KEYS.permissions
            );

        if (!stored) {
            return [];
        }

        try {

            let parsed: unknown =
                JSON.parse(stored);

            // ----------------------------------------------------
            // Handle double-encoded JSON
            // ----------------------------------------------------

            if (typeof parsed === "string") {

                try {

                    parsed =
                        JSON.parse(parsed);

                } catch {

                    return [];
                }
            }

            // ----------------------------------------------------
            // Direct array
            // ----------------------------------------------------

            if (Array.isArray(parsed)) {
                return parsed;
            }

            // ----------------------------------------------------
            // { permissions: [...] }
            // ----------------------------------------------------

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                const object =
                    parsed as Record<string, unknown>;

                if (
                    Array.isArray(
                        object.permissions
                    )
                ) {
                    return object.permissions;
                }

                // ------------------------------------------------
                // { Permissions: [...] }
                // ------------------------------------------------

                if (
                    Array.isArray(
                        object.Permissions
                    )
                ) {
                    return object.Permissions;
                }
            }

            return [];

        } catch (error) {

            console.error(
                "EPIC PermissionService: Failed to parse permissions.",
                error
            );

            return [];
        }
    }

    // ============================================================
    // PARSE PERMISSION ITEM
    // ============================================================

    private parsePermissionItem(
        item: unknown
    ): Permission | null {

        // --------------------------------------------------------
        // JSON STRING
        // --------------------------------------------------------

        if (typeof item === "string") {

            try {

                item =
                    JSON.parse(item);

            } catch {

                return null;
            }
        }

        if (
            !item ||
            typeof item !== "object"
        ) {
            return null;
        }

        const source =
            item as Record<string, unknown>;

        // --------------------------------------------------------
        // MODULE NAME
        // --------------------------------------------------------

        const moduleName =
            source.module ??
            source.Module ??
            source.moduleName ??
            source.ModuleName ??
            source.name ??
            source.Name ??
            "";

        if (
            typeof moduleName !== "string" ||
            !moduleName.trim()
        ) {
            return null;
        }

        // --------------------------------------------------------
        // PERMISSION OBJECT
        // --------------------------------------------------------

        return {

            module:
                moduleName.trim(),

            view:
                this.toBoolean(
                    source.view ??
                    source.View ??
                    source.canView ??
                    source.CanView ??
                    source.allowView ??
                    source.AllowView
                ),

            create:
                this.toBoolean(
                    source.create ??
                    source.Create ??
                    source.canCreate ??
                    source.CanCreate ??
                    source.allowCreate ??
                    source.AllowCreate
                ),

            edit:
                this.toBoolean(
                    source.edit ??
                    source.Edit ??
                    source.update ??
                    source.Update ??
                    source.canEdit ??
                    source.CanEdit ??
                    source.allowEdit ??
                    source.AllowEdit
                ),

            delete:
                this.toBoolean(
                    source.delete ??
                    source.Delete ??
                    source.remove ??
                    source.Remove ??
                    source.canDelete ??
                    source.CanDelete ??
                    source.allowDelete ??
                    source.AllowDelete
                ),

            export:
                this.toBoolean(
                    source.export ??
                    source.Export ??
                    source.canExport ??
                    source.CanExport ??
                    source.allowExport ??
                    source.AllowExport
                )
        };
    }

    // ============================================================
    // GET PARSED PERMISSIONS
    // ============================================================

    getParsedPermissions(): Permission[] {

        const raw =
            this.getPermissions();

        if (!Array.isArray(raw)) {
            return [];
        }

        return raw
            .map(item =>
                this.parsePermissionItem(item)
            )
            .filter(
                (
                    permission
                ): permission is Permission =>
                    permission !== null
            );
    }

    // ============================================================
    // FIND PERMISSION
    // ============================================================

    private findPermission(
        module: string
    ): Permission | null {

        const requested =
            this.normalizeModule(module);

        if (!requested) {
            return null;
        }

        return (
            this.getParsedPermissions()
                .find(
                    permission =>
                        this.normalizeModule(
                            permission.module
                        ) === requested
                ) ||
            null
        );
    }

    // ============================================================
    // HAS PERMISSION
    //
    // IMPORTANT:
    //
    // Frontend permission state is used for UI access.
    //
    // Backend authorization remains the real security layer.
    // ============================================================

    hasPermission(
        module: string,
        action: PermissionAction
    ): boolean {

        // --------------------------------------------------------
        // ADMIN = FULL ACCESS
        // --------------------------------------------------------

        if (this.isAdministrator()) {
            return true;
        }

        // --------------------------------------------------------
        // NORMALIZE ACTION
        // --------------------------------------------------------

        const normalizedAction =
            this.normalizeAction(action);

        if (!normalizedAction) {
            return false;
        }

        // --------------------------------------------------------
        // FIND MODULE
        // --------------------------------------------------------

        const permission =
            this.findPermission(module);

        if (!permission) {
            return false;
        }

        // --------------------------------------------------------
        // CHECK ACTION
        // --------------------------------------------------------

        return permission[
            normalizedAction
        ] === true;
    }

    // ============================================================
    // VIEW
    // ============================================================

    canView(
        module: string
    ): boolean {

        return this.hasPermission(
            module,
            "view"
        );
    }

    // ============================================================
    // CREATE
    // ============================================================

    canCreate(
        module: string
    ): boolean {

        return this.hasPermission(
            module,
            "create"
        );
    }

    // ============================================================
    // EDIT
    // ============================================================

    canEdit(
        module: string
    ): boolean {

        return this.hasPermission(
            module,
            "edit"
        );
    }

    // ============================================================
    // DELETE
    // ============================================================

    canDelete(
        module: string
    ): boolean {

        return this.hasPermission(
            module,
            "delete"
        );
    }

    // ============================================================
    // EXPORT
    // ============================================================

    canExport(
        module: string
    ): boolean {

        return this.hasPermission(
            module,
            "export"
        );
    }

    // ============================================================
    // GET MODULE PERMISSION
    // ============================================================

    getModulePermission(
        module: string
    ): Permission | null {

        return this.findPermission(module);
    }

    // ============================================================
    // GET ALL PERMISSIONS
    // ============================================================

    getAllPermissions(): Permission[] {

        return this.getParsedPermissions();
    }

    // ============================================================
    // HAS ANY PERMISSION
    // ============================================================

    hasAnyPermission(
        module: string
    ): boolean {

        if (this.isAdministrator()) {
            return true;
        }

        const permission =
            this.findPermission(module);

        if (!permission) {
            return false;
        }

        return (
            permission.view ||
            permission.create ||
            permission.edit ||
            permission.delete ||
            permission.export
        );
    }

    // ============================================================
    // HAS ALL PERMISSIONS
    // ============================================================

    hasAllPermissions(
        module: string,
        actions: PermissionAction[]
    ): boolean {

        if (this.isAdministrator()) {
            return true;
        }

        if (!actions.length) {
            return true;
        }

        return actions.every(
            action =>
                this.hasPermission(
                    module,
                    action
                )
        );
    }

    // ============================================================
    // SAVE PERMISSIONS
    // ============================================================

    setPermissions(
        permissions: unknown[]
    ): void {

        if (!Array.isArray(permissions)) {

            console.error(
                "EPIC PermissionService: Expected permissions array."
            );

            return;
        }

        localStorage.setItem(
            STORAGE_KEYS.permissions,
            JSON.stringify(permissions)
        );

        this.notifyPermissionChange();
    }

    // ============================================================
    // CLEAR PERMISSIONS
    // ============================================================

    clearPermissions(): void {

        localStorage.removeItem(
            STORAGE_KEYS.permissions
        );

        this.notifyPermissionChange();
    }

    // ============================================================
    // PERMISSION CHANGE EVENT
    // ============================================================

    private notifyPermissionChange(): void {

        window.dispatchEvent(
            new Event(
                "epic:permissions-changed"
            )
        );
    }

    // ============================================================
    // DEBUG
    // ============================================================

    debugPermissions(): void {

        console.group(
            "🔐 EPIC PERMISSION DEBUG"
        );

        console.log(
            "User:",
            this.getCurrentUser()
        );

        console.log(
            "Full Name:",
            this.getCurrentFullName()
        );

        console.log(
            "Role:",
            this.getCurrentRole()
        );

        console.log(
            "Role ID:",
            this.getCurrentRoleId()
        );

        console.log(
            "Administrator:",
            this.isAdministrator()
        );

        console.log(
            "Member:",
            this.isMemberOnly()
        );

        const permissions =
            this.getParsedPermissions();

        console.log(
            "Permissions:",
            permissions
        );

        console.table(
            permissions
        );

        console.group(
            "EPIC MODULE CHECK"
        );

        EPIC_PERMISSION_MODULES.forEach(
            module => {

                console.log(
                    module,
                    {
                        view:
                            this.canView(module),

                        create:
                            this.canCreate(module),

                        edit:
                            this.canEdit(module),

                        delete:
                            this.canDelete(module),

                        export:
                            this.canExport(module)
                    }
                );
            }
        );

        console.groupEnd();
        console.groupEnd();
    }
}

// ============================================================
// SINGLETON
// ============================================================

const permissionService =
    new PermissionService();

export default permissionService;