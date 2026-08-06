namespace EPIC.Api.DTOs
{
    public class PermissionDto
    {
        public int PermissionId { get; set; }

        public int RoleId { get; set; }

        public string Module { get; set; } = "";

        public bool CanView { get; set; }

        public bool CanCreate { get; set; }

        public bool CanEdit { get; set; }

        public bool CanDelete { get; set; }

        public bool CanExport { get; set; }
    }
}