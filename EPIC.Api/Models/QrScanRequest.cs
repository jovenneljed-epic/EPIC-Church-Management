namespace EPIC.Api.Models
{
    public class QrScanRequest
    {
        public string QrToken { get; set; } = "";

        public string ScanType { get; set; } = "";

        public int? ReferenceId { get; set; }
    }
}