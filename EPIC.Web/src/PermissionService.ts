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

class PermissionService {

    private readonly PERMISSIONS_KEY = "permissions";

    // ============================================================
    // NORMALIZE MODULE
    // ============================================================

    private normalizeModule(module: unknown): string {

        return String(module ?? "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    // ============================================================
    // NORMALIZE ACTION
    // ============================================================

    private normalizeAction(
        action: string
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

    private toBoolean(value: unknown): boolean {

        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "number") {
            return value === 1;
        }

        if (typeof value === "string") {

            const valueLower =
                value.trim().toLowerCase();

            return (
                valueLower === "true" ||
                valueLower === "1" ||
                valueLower === "yes" ||
                valueLower === "y"
            );
        }

        return false;
    }

    // ============================================================
    // CURRENT USER
    // ============================================================

    getCurrentUser(): string {

        return (
            localStorage.getItem("currentUser") ||
            localStorage.getItem("username") ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT FULL NAME
    // ============================================================

    getCurrentFullName(): string {

        return (
            localStorage.getItem("currentFullName") ||
            localStorage.getItem("fullName") ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT ROLE
    // ============================================================

    getCurrentRole(): string {

        return (
            localStorage.getItem("currentRole") ||
            localStorage.getItem("role") ||
            ""
        ).trim();
    }

    // ============================================================
    // CURRENT ROLE ID
    // ============================================================

    getCurrentRoleId(): number | null {

        const value =
            localStorage.getItem("currentRoleId") ||
            localStorage.getItem("roleId");

        if (!value) {
            return null;
        }

        const id = Number(value);

        return Number.isFinite(id)
            ? id
            : null;
    }

    // ============================================================
    // ROLE NORMALIZATION
    // ============================================================

    private getNormalizedRole(): string {

        return this.getCurrentRole()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    // ============================================================
    // IS ADMINISTRATOR
    // ============================================================

    isAdministrator(): boolean {

        const role =
            this.getNormalizedRole();

        return (
            role === "administrator" ||
            role === "admin" ||
            role === "system administrator" ||
            role === "super admin" ||
            role === "superadmin"
        );
    }

    // ============================================================
    // IS MEMBER ONLY
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
            role === "members" ||
            role === "member" ||
            role === "memberonly" ||
            role === "member only" ||
            roleId === 4 ||
            username === "memberonly"
        );
    }

    // ============================================================
    // GET RAW PERMISSIONS
    // ============================================================

    getPermissions(): unknown[] {

        const stored =
            localStorage.getItem(
                this.PERMISSIONS_KEY
            );

        if (!stored) {
            return [];
        }

        try {

            let parsed: unknown =
                JSON.parse(stored);

            /*
             * Handles accidentally double-encoded
             * JSON such as:
             *
             * "[{\"module\":\"Dashboard\"...}]"
             */

            if (typeof parsed === "string") {

                try {
                    parsed = JSON.parse(parsed);
                } catch {
                    return [];
                }
            }

            // Direct array
            if (Array.isArray(parsed)) {
                return parsed;
            }

            // { permissions: [...] }
            if (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray(
                    (parsed as any).permissions
                )
            ) {
                return (parsed as any).permissions;
            }

            // { Permissions: [...] }
            if (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray(
                    (parsed as any).Permissions
                )
            ) {
                return (parsed as any).Permissions;
            }

            return [];

        } catch (error) {

            console.error(
                "❌ Permission JSON parsing failed:",
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

        /*
         * Some APIs/localStorage implementations can
         * accidentally store each permission as a JSON string.
         */

        if (typeof item === "string") {

            try {
                item = JSON.parse(item);
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
                    source.canDelete ??
                    source.CanDelete ??
                    source.remove ??
                    source.Remove ??
                    source.canDelete ??
                    source.CanDelete
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
    // PARSED PERMISSIONS
    // ============================================================

    getParsedPermissions(): Permission[] {

        const raw =
            this.getPermissions();

        if (!Array.isArray(raw)) {
            return [];
        }

        const parsed: Permission[] = [];

        raw.forEach(item => {

            const permission =
                this.parsePermissionItem(item);

            if (permission) {
                parsed.push(permission);
            }
        });

        return parsed;
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

        return (
            permissions.find(
                permission =>
                    this.normalizeModule(
                        permission.module
                    ) === requested
            ) || null
        );
    }

    // ============================================================
    // HAS PERMISSION
    // ============================================================

    hasPermission(
        module: string,
        action: PermissionAction
    ): boolean {

        const normalizedAction =
            this.normalizeAction(action);

        if (!normalizedAction) {
            return false;
        }

        /*
         * MEMBER ONLY USERS
         *
         * Members can VIEW permitted modules,
         * but cannot CREATE / EDIT / DELETE / EXPORT.
         */
        if (this.isMemberOnly()) {

            if (
                normalizedAction === "create" ||
                normalizedAction === "edit" ||
                normalizedAction === "delete" ||
                normalizedAction === "export"
            ) {
                return false;
            }
        }

        /*
         * FIND MODULE PERMISSION
         */
        const permission =
            this.findPermission(module);

        /*
         * No permission record = DENIED
         */
        if (!permission) {
            return false;
        }

        /*
         * Return the actual permission value.
         */
        return Boolean(
            permission[normalizedAction]
        );
    }

    // ============================================================
    // VIEW
    // ============================================================

    canView(module: string): boolean {

        return this.hasPermission(
            module,
            "view"
        );
    }

    // ============================================================
    // CREATE
    // ============================================================

    canCreate(module: string): boolean {

        return this.hasPermission(
            module,
            "create"
        );
    }

    // ============================================================
    // EDIT
    // ============================================================

    canEdit(module: string): boolean {

        return this.hasPermission(
            module,
            "edit"
        );
    }

    // ============================================================
    // DELETE
    // ============================================================

    canDelete(module: string): boolean {

        return this.hasPermission(
            module,
            "delete"
        );
    }

    // ============================================================
    // EXPORT
    // ============================================================

    canExport(module: string): boolean {

        return this.hasPermission(
            module,
            "export"
        );
    }

    // ============================================================
    // GET MODULE
    // ============================================================

    getModulePermission(
        module: string
    ): Permission | null {

        return this.findPermission(module);
    }

    // ============================================================
    // GET ALL
    // ============================================================

    getAllPermissions(): Permission[] {

        return this.getParsedPermissions();
    }

    // ============================================================
    // ANY PERMISSION
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
    // ALL PERMISSIONS
    // ============================================================

    hasAllPermissions(
        module: string,
        actions: PermissionAction[]
    ): boolean {

        if (this.isAdministrator()) {
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
    // SAVE
    // ============================================================

    setPermissions(
        permissions: unknown[]
    ): void {

        if (!Array.isArray(permissions)) {

            console.error(
                "❌ Cannot save permissions. Expected array."
            );

            return;
        }

        localStorage.setItem(
            this.PERMISSIONS_KEY,
            JSON.stringify(permissions)
        );
    }

    // ============================================================
    // CLEAR
    // ============================================================

    clearPermissions(): void {

        localStorage.removeItem(
            this.PERMISSIONS_KEY
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
            "Current User:",
            this.getCurrentUser()
        );

        console.log(
            "Current Full Name:",
            this.getCurrentFullName()
        );

        console.log(
            "Current Role:",
            this.getCurrentRole()
        );

        console.log(
            "Current Role ID:",
            this.getCurrentRoleId()
        );

        console.log(
            "Is Administrator:",
            this.isAdministrator()
        );

        console.log(
            "Is Member Only:",
            this.isMemberOnly()
        );

        const raw =
            this.getPermissions();

        console.log(
            "Raw Permissions:",
            raw
        );

        const parsed =
            this.getParsedPermissions();
        const churchServicesPermission =
            this.getModulePermission("Church Services");

        console.log(
            "⛪ CHURCH SERVICES PERMISSION:",
            churchServicesPermission
        );

        console.log(
            "⛪ Church Services VIEW:",
            this.canView("Church Services")
        );

        console.log(
            "⛪ Church Services CREATE:",
            this.canCreate("Church Services")
        );

        console.log(
            "⛪ Church Services EDIT:",
            this.canEdit("Church Services")
        );

        console.log(
            "⛪ Church Services DELETE:",
            this.canDelete("Church Services")
        );

        console.log(
            "Parsed Permissions:",
            parsed
        );

        console.table(parsed);

        console.group(
            "🧪 PERMISSION CHECKS"
        );

        const modules = [
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
            "Settings"
        ];

        modules.forEach(module => {

            console.log(
                module,
                {
                    view: this.canView(module),
                    create: this.canCreate(module),
                    edit: this.canEdit(module),
                    delete: this.canDelete(module),
                    export: this.canExport(module)
                }
            );
        });

        console.groupEnd();

        console.groupEnd();
    }
}

export default new PermissionService();