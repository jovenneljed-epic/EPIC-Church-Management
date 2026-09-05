using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.DTOs;


namespace EPIC.Api.Controllers
{

    [ApiController]
    [Route("api/public/reports")]
    public class PublicReportsController : ControllerBase
    {


        private readonly ApplicationDbContext _context;



        public PublicReportsController(
            ApplicationDbContext context)
        {
            _context = context;
        }




        [HttpGet("ministries")]

        public async Task<IActionResult> GetMinistryReports()
        {


            var ministries =
            await _context.Ministries

            .Where(x =>
            x.Status == "ACTIVE"
            &&
            x.ServiceTypeMapping != null
            )

            .ToListAsync();



            var reports =
            new List<MinistryReportDto>();




            foreach (var ministry in ministries)
            {


                var members =
                await _context.MinistryMembers

                .Where(x =>

                x.MinistryId == ministry.MinistryId

                &&

                x.Status == "ACTIVE"

                )

                .ToListAsync();





                var services =
                await _context.ChurchServices

                .Where(x =>

                x.ServiceType ==
                ministry.ServiceTypeMapping

                )

                .ToListAsync();





                var attendance =
                await _context.Attendances

                .Where(x =>

                x.ChurchServiceId != null

                &&

                services

                .Select(s => s.ChurchServiceId)

                .Contains(
                x.ChurchServiceId.Value
                )

                &&

                x.Status == "PRESENT"

                )

                .CountAsync();






                reports.Add(new MinistryReportDto

                {

                    MinistryId =
                ministry.MinistryId,


                    MinistryName =
                ministry.Name,


                    ServiceType =
                ministry.ServiceTypeMapping!,


                    MemberCount =
                members.Count,


                    VolunteerCount =
                members.Count(x =>

                x.Role.ToLower()
                .Contains("volunteer")

                ||


                x.Position.ToLower()
                .Contains("volunteer")

                ),



                    UpcomingActivities =
                services.Count(x =>

                x.ServiceDate >= DateTime.Now

                ),



                    TotalAttendance =
                attendance,



                    LastActivity =
                services

                .OrderByDescending(x => x.ServiceDate)

                .Select(x => (DateTime?)x.ServiceDate)

                .FirstOrDefault()


                });


            }



            return Ok(reports);


        }


    }

}