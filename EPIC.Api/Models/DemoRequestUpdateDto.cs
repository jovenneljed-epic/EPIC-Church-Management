namespace EPIC.Api.Controllers
{
    public class UpdateDemoRequestDto
    {
        public string? Status { get; set; }

        public string? AdminNotes { get; set; }

        public DateTime? ContactedDate { get; set; }

        public DateTime? DemoDate { get; set; }
    }
}