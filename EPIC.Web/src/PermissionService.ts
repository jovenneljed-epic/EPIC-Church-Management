
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

    // New permission-controlled modules
    "Demo Requests",
    "EPIC Learning"
] as const;

// ============================================================
// PERMISSION SERVICE
// ============================================================

class PermissionService {

    private readonly PERMISSIONS_KEY =
        "permissions";

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

            const normalized =
                value.trim().toLowerCase();

            return (
                normalized === "true" ||
                normalized === "1" ||
                normalized === "yes" ||
                normalized === "y"
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
    // NORMALIZED ROLE
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
    //
    // This is informational only.
    //
    // IMPORTANT:
    // Member permissions are now controlled entirely by the
    // Permissions table.
    //
    // This method does NOT automatically deny actions.
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

            // ----------------------------------------------------
            // Handle double-encoded JSON
            // ----------------------------------------------------

            if (typeof parsed === "string") {

                try {

                    parsed =
                        JSON.parse(parsed);

                }
                catch {

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
                typeof parsed === "object" &&
                Array.isArray(
                    (parsed as any).permissions
                )
            ) {

                return (
                    (parsed as any)
                        .permissions
                );
            }

            // ----------------------------------------------------
            // { Permissions: [...] }
            // ----------------------------------------------------

            if (
                parsed &&
                typeof parsed === "object" &&
                Array.isArray(
                    (parsed as any).Permissions
                )
            ) {

                return (
                    (parsed as any)
                        .Permissions
                );
            }

            return [];

        }
        catch (error) {

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

        // --------------------------------------------------------
        // Handle JSON string permission
        // --------------------------------------------------------

        if (typeof item === "string") {

            try {

                item =
                    JSON.parse(item);

            }
            catch {

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
        // MODULE
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
        // RETURN NORMALIZED PERMISSION
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
    // GET PARSED PERMISSIONS
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

                parsed.push(
                    permission
                );
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
    //
    // DATABASE/ROLE PERMISSIONS ARE THE AUTHORITY.
    //
    // There is NO special Member restriction here.
    //
    // Example:
    //
    // Member + Demo Requests View = false
    // => Member cannot view Demo Requests.
    //
    // Staff + Demo Requests View = true
    // => Staff can view Demo Requests.
    //
    // Staff + Demo Requests Delete = false
    // => Staff cannot delete Demo Requests.
    //
    // Admin = automatic full access.
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

        // --------------------------------------------------------
        // ADMINISTRATOR BYPASS
        // --------------------------------------------------------

        if (this.isAdministrator()) {
            return true;
        }

        // --------------------------------------------------------
        // FIND MODULE PERMISSION
        // --------------------------------------------------------

        const permission =
            this.findPermission(module);

        // --------------------------------------------------------
        // NO PERMISSION RECORD = DENIED
        // --------------------------------------------------------

        if (!permission) {
            return false;
        }

        // --------------------------------------------------------
        // RETURN ACTUAL PERMISSION
        // --------------------------------------------------------

        return Boolean(
            permission[
                normalizedAction
            ]
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

        return this.findPermission(
            module
        );
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
                "❌ Cannot save permissions. Expected array."
            );

            return;
        }

        localStorage.setItem(
            this.PERMISSIONS_KEY,
            JSON.stringify(
                permissions
            )
        );

        // --------------------------------------------------------
        // Notify EPIC components
        // --------------------------------------------------------

        window.dispatchEvent(
            new Event(
                "epic:permissions-changed"
            )
        );
    }

    // ============================================================
    // CLEAR PERMISSIONS
    // ============================================================

    clearPermissions(): void {

        localStorage.removeItem(
            this.PERMISSIONS_KEY
        );

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

        console.log(
            "Raw Permissions:",
            this.getPermissions()
        );

        const parsed =
            this.getParsedPermissions();

        console.log(
            "Parsed Permissions:",
            parsed
        );

        console.table(
            parsed
        );

        // --------------------------------------------------------
        // Important EPIC modules
        // --------------------------------------------------------

        const importantModules = [
            "Demo Requests",
            "EPIC Learning"
        ];

        console.group(
            "⭐ NEW EPIC MODULE PERMISSIONS"
        );

        importantModules.forEach(
            module => {

                const permission =
                    this.getModulePermission(
                        module
                    );

                console.log(
                    module,
                    {
                        permission,

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
                            )
                    }
                );
            }
        );

        console.groupEnd();

        // --------------------------------------------------------
        // All standard modules
        // --------------------------------------------------------

        console.group(
            "🧪 EPIC PERMISSION CHECKS"
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
                            )
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

export default new PermissionService();

