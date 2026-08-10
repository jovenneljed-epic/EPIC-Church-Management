using System.ComponentModel.DataAnnotations;

namespace EPIC.Api.Models
{
    public class UserRegisterRequest
    {
        [Required]
        public string MemberCode { get; set; } = "";

        [Required]
        public string LastName { get; set; } = "";

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = "";

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = "";
    }
}