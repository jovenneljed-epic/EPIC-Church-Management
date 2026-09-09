using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Models;
[Index(nameof(ClientMemberId), nameof(CourseId), IsUnique = true)]
public class ClientCourseEnrollment
{
    [Key] public int Id { get; set; }
    public int ClientMemberId { get; set; }
    public ClientMember ClientMember { get; set; } = null!;
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
}
[Index(nameof(ClientCourseEnrollmentId), nameof(LessonId), IsUnique = true)]
public class ClientLessonCompletion
{
    [Key] public int Id { get; set; }
    public int ClientCourseEnrollmentId { get; set; }
    public ClientCourseEnrollment ClientCourseEnrollment { get; set; } = null!;
    public int LessonId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
