
// ============================================================
// EPIC CHURCH MANAGEMENT SYSTEM
// PermissionService.ts
//
// Frontend permission service.
// IMPORTANT:
// - Frontend permissions control UI visibility.
// - Backend authorization remains the REAL security layer.
// - ADMIN receives full UI access.
// - Permission names are normalized consistently.
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
    "Events",
    "Giving",
    "Income",
    "Expenses",
    "Ministries",
    "Reports",
    "Settings",
    "Demo Requests",
    "Subscriptions",
    "Website Analytics",
    "EPIC Learning",
] as const;

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEYS = {
    permissions: "permissions",
    epicPermissions: "epicPermissions",

    currentUser: "currentUser",
    username: "username",

    currentFullName: "currentFullName",
    fullName: "fullName",

    currentRole: "currentRole",
    role: "role",

    currentRoleId: "currentRoleId",
    roleId: "roleId",

    token: "token",
    accessToken: "accessToken",
    jwt: "jwt",
    authToken: "authToken",
    epicToken: "epicToken",

    userId: "userId",
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
                case "on":
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

        const roleId =
            Number(value);

        return Number.isInteger(roleId) &&
            roleId > 0
            ? roleId
            : null;
    }

    // ============================================================
    // CURRENT USER ID
    // ============================================================

    getCurrentUserId(): number | null {

        const value =
            localStorage.getItem(
                STORAGE_KEYS.userId
            );

        if (!value) {
            return null;
        }

        const userId =
            Number(value);

        return Number.isInteger(userId) &&
            userId > 0
            ? userId
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

        const roleId =
            this.getCurrentRoleId();

        /*
         * EPIC default ADMIN role ID is 1.
         *
         * We support both:
         * - role name
         * - role ID
         *
         * This prevents the UI from breaking when one of the
         * stored values is missing.
         */

        if (roleId === 1) {
            return true;
        }

        return [
            "admin",
            "administrator",
            "system administrator",
            "super admin",
            "superadmin",
            "system admin",
        ].includes(role);
    }

    // ============================================================
    // MEMBER CHECK
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

        /*
         * Support both storage keys.
         *
         * Older Login.tsx:
         *     permissions
         *
         * Newer Login.tsx:
         *     epicPermissions
         */

        const stored =
            localStorage.getItem(
                STORAGE_KEYS.permissions
            ) ||
            localStorage.getItem(
                STORAGE_KEYS.epicPermissions
            );

        if (!stored) {
            return [];
        }

        try {

            let parsed: unknown =
                JSON.parse(stored);

            // ----------------------------------------------------
            // Double encoded JSON
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
            // Wrapped permissions
            // ----------------------------------------------------

            if (
                parsed &&
                typeof parsed === "object"
            ) {

                const object =
                    parsed as Record<
                        string,
                        unknown
                    >;

                const possibleKeys = [
                    "permissions",
                    "Permissions",
                    "permission",
                    "Permission",
                    "data",
                    "Data",
                ];

                for (
                    const key of possibleKeys
                ) {

                    const value =
                        object[key];

                    if (
                        Array.isArray(
                            value
                        )
                    ) {
                        return value;
                    }
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
        // STRING JSON
        // --------------------------------------------------------

        if (typeof item === "string") {

            try {

                item =
                    JSON.parse(item);

            } catch {

                return null;
            }
        }

        // --------------------------------------------------------
        // OBJECT
        // --------------------------------------------------------

        if (
            !item ||
            typeof item !== "object"
        ) {
            return null;
        }

        const source =
            item as Record<
                string,
                unknown
            >;

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
        // NORMALIZED PERMISSION
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
                ),
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
            .map(
                item =>
                    this.parsePermissionItem(
                        item
                    )
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

        const permissions =
            this.getParsedPermissions();

        /*
         * First attempt: exact normalized match.
         */

        const exact =
            permissions.find(
                permission =>
                    this.normalizeModule(
                        permission.module
                    ) === requested
            );

        if (exact) {
            return exact;
        }

        /*
         * Compatibility aliases.
         */

        const aliases:
            Record<string, string[]> = {

                "event management": [
                    "events",
                    "event"
                ],

                "events": [
                    "event management",
                    "event"
                ],

                "church services": [
                    "services",
                    "church service"
                ],

                "services": [
                    "church services",
                    "church service"
                ],

                "website analytics": [
                    "websiteanalytics",
                    "analytics",
                    "website analytics dashboard"
                ],

                "epic learning": [
                    "learning",
                    "epic lms",
                    "lms"
                ],

                "demo requests": [
                    "demorequests",
                    "demo request"
                ],

                "subscriptions": [
                    "subscription",
                    "subscription management"
                ],
            };

        const requestedAliases =
            aliases[requested] || [];

        for (
            const alias of requestedAliases
        ) {

            const match =
                permissions.find(
                    permission =>
                        this.normalizeModule(
                            permission.module
                        ) ===
                        this.normalizeModule(
                            alias
                        )
                );

            if (match) {
                return match;
            }
        }

        return null;
    }

    // ============================================================
    // HAS PERMISSION
    // ============================================================

    hasPermission(
        module: string,
        action: PermissionAction
    ): boolean {

        // --------------------------------------------------------
        // ADMIN = FULL UI ACCESS
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
        // FIND PERMISSION
        // --------------------------------------------------------

        const permission =
            this.findPermission(module);

        if (!permission) {
            return false;
        }

        // --------------------------------------------------------
        // CHECK ACTION
        // --------------------------------------------------------

        return (
            permission[
                normalizedAction
            ] === true
        );
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

        if (this.isAdministrator()) {

            return {
                module,
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
            };
        }

        return this.findPermission(
            module
        );
    }

    // ============================================================
    // GET ALL PERMISSIONS
    // ============================================================

    getAllPermissions(): Permission[] {

        /*
         * ADMIN should appear as having all modules.
         * This also makes debugging much clearer.
         */

        if (this.isAdministrator()) {

            return EPIC_PERMISSION_MODULES.map(
                module => ({
                    module,
                    view: true,
                    create: true,
                    edit: true,
                    delete: true,
                    export: true,
                })
            );
        }

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

        const serialized =
            JSON.stringify(
                permissions
            );

        /*
         * Save to the primary key.
         */

        localStorage.setItem(
            STORAGE_KEYS.permissions,
            serialized
        );

        /*
         * Also keep epicPermissions synchronized
         * for compatibility with older Login.tsx versions.
         */

        localStorage.setItem(
            STORAGE_KEYS.epicPermissions,
            serialized
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

        localStorage.removeItem(
            STORAGE_KEYS.epicPermissions
        );

        this.notifyPermissionChange();
    }

    // ============================================================
    // CLEAR ALL AUTHENTICATION DATA
    // ============================================================

    clearAuthentication(): void {

        const keys = [
            ...Object.values(
                STORAGE_KEYS
            ),
        ];

        keys.forEach(
            key =>
                localStorage.removeItem(
                    key
                )
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

        window.dispatchEvent(
            new Event(
                "epic:auth-changed"
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
            "User ID:",
            this.getCurrentUserId()
        );

        console.log(
            "Administrator:",
            this.isAdministrator()
        );

        console.log(
            "Member:",
            this.isMemberOnly()
        );

        const raw =
            this.getPermissions();

        console.log(
            "Raw Permission Count:",
            raw.length
        );

        const permissions =
            this.getAllPermissions();

        console.log(
            "Parsed Permission Count:",
            permissions.length
        );

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
                            this.canView(
                                module
                            ),

                        create:
                            this.canCreate(
                                module
                            ),

                        edit:
                            this.canEdit(
                                module
                            ),

                        delete:
                            this.canDelete(
                                module
                            ),

                        export:
                            this.canExport(
                                module
                            ),
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

