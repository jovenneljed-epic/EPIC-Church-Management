using EPIC.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace EPIC.Api.Data;
public partial class ApplicationDbContext
{
    public DbSet<ClientCourseEnrollment> ClientCourseEnrollments => Set<ClientCourseEnrollment>();
    public DbSet<ClientLessonCompletion> ClientLessonCompletions => Set<ClientLessonCompletion>();
}
