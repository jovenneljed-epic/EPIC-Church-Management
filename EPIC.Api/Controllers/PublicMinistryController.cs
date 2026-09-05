using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EPIC.Api.Data;
using EPIC.Api.DTOs;


namespace EPIC.Api.Controllers
{

    [ApiController]
    [Route("api/public/ministries")]
    public class PublicMinistryController : ControllerBase
    {

        private readonly ApplicationDbContext _context;


        public PublicMinistryController(
            ApplicationDbContext context)
        {
            _context = context;
        }



        // =====================================================
        // GET ALL MINISTRY EVALUATIONS
        // GET:
        // /api/public/ministries/evaluation
        // =====================================================

        [HttpGet("evaluation")]
        public async Task<IActionResult> GetMinistryEvaluation()
        {

            var ministries =
                await _context.Ministries

                .Where(x =>
                    x.Status == "ACTIVE"
                )

                .Include(x =>
                    x.MinistryMembers
                )

                .ThenInclude(x =>
                    x.Member
                )

                .ToListAsync();



            var result =
                ministries.Select(ministry =>
                {

                    var members =
                        ministry.MinistryMembers

                        .Where(x =>
                            x.Status == "ACTIVE"
                        )

                        .Select(x =>
                            new MinistryMemberEvaluationDto
                            {

                                MemberId =
                                    x.MemberId,


                                Name =
                                    x.Member != null
                                    ?
                                    $"{x.Member.FirstName} {x.Member.LastName}"
                                    :
                                    "Unknown",


                                Role =
                                    x.Role ?? "Member",


                                Position =
                                    x.Position ?? "",


                                PhotoPath =
                                    x.Member != null
                                    ?
                                    x.Member.PhotoPath
                                    :
                                    ""

                            })

                        .ToList();



                    return new MinistryEvaluationDto
                    {

                        MinistryId =
                            ministry.MinistryId,


                        MinistryName =
                            ministry.Name,


                        MinistryHead =
                            ministry.MinistryHead ??
                            "Not Assigned",


                        Description =
                            ministry.Description ??
                            "",


                        MeetingDay =
                            ministry.MeetingDay ??
                            "",


                        MeetingTime =
                            ministry.MeetingTime ??
                            "",


                        MeetingLocation =
                            ministry.MeetingLocation ??
                            "",


                        TotalMembers =
                            members.Count,


                        Members =
                            members

                    };


                })

                .ToList();



            return Ok(result);

        }






        // =====================================================
        // GET SINGLE MINISTRY EVALUATION DETAIL
        // GET:
        // /api/public/ministries/{id}/evaluation
        // =====================================================

        [HttpGet("{id:int}/evaluation")]
        public async Task<IActionResult> GetMinistryEvaluationDetail(
            int id
        )
        {


            var ministry =
                await _context.Ministries

                .Include(x =>
                    x.MinistryMembers
                )

                .ThenInclude(x =>
                    x.Member
                )

                .FirstOrDefaultAsync(
                    x =>
                    x.MinistryId == id
                );



            if (ministry == null)
            {
                return NotFound(
                    new
                    {
                        message =
                        "Ministry not found"
                    }
                );
            }





            var members =
                ministry.MinistryMembers

                .Where(x =>
                    x.Status == "ACTIVE"
                )

                .Select(x =>
                    new MinistryMemberEvaluationDto
                    {

                        MemberId =
                            x.MemberId,


                        Name =
                            x.Member != null
                            ?
                            $"{x.Member.FirstName} {x.Member.LastName}"
                            :
                            "Unknown",


                        Role =
                            x.Role ?? "Member",


                        Position =
                            x.Position ?? "",


                        PhotoPath =
                            x.Member != null
                            ?
                            x.Member.PhotoPath
                            :
                            ""

                    })

                .ToList();





            return Ok(
                new
                {

                    ministryId =
                        ministry.MinistryId,


                    ministryName =
                        ministry.Name,


                    ministryHead =
                        ministry.MinistryHead ??
                        "Not Assigned",


                    description =
                        ministry.Description ??
                        "",


                    meetingDay =
                        ministry.MeetingDay ??
                        "",


                    meetingTime =
                        ministry.MeetingTime ??
                        "",


                    meetingLocation =
                        ministry.MeetingLocation ??
                        "",


                    totalMembers =
                        members.Count,


                    members

                }
            );

        }


    }

}