namespace EPIC.Api.Models
{
    public class QrScanLog
    {
        public int QrScanLogId { get; set; }

        public int MemberId { get; set; }

        // What this QR was used for
        // Examples:
        // CHURCH_SERVICE
        // EVENT
        // CR_BREAK
        public string ScanType { get; set; } = string.Empty;

        // ID of the related record
        // ChurchServiceId / EventId / CRBreakPassId
        public int? ReferenceId { get; set; }

        public string Result { get; set; } = "SUCCESS";

        public DateTime ScanDate { get; set; } = DateTime.UtcNow;


        public Member Member { get; set; } = null!;
    }
}