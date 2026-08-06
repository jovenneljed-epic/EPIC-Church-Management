namespace EPIC.Api.Models
{
    public class ChurchSettings
    {
        public int ChurchSettingsId { get; set; }

        public string ChurchName { get; set; } = "";

        public string ChurchCode { get; set; } = "";

        public string Address { get; set; } = "";

        public string ContactNumber { get; set; } = "";

        public string Email { get; set; } = "";

        public string PastorName { get; set; } = "";

        public string LogoPath { get; set; } = "";

        public DateTime UpdatedDate { get; set; } = DateTime.Now;
    }
}
