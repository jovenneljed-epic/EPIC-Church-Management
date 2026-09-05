const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://localhost:7001/api";



// ======================================
// AUTH HEADERS
// ======================================

function getAuthHeaders()
{

    const token =
        localStorage.getItem("token");


    return {

        "Content-Type":
            "application/json",

        ...(token
            ? {
                Authorization:
                `Bearer ${token}`
            }
            : {}
        )

    };

}



// ======================================
// TYPES
// ======================================


export interface MinistryMember {

    memberId:number;

    name:string;

    role:string;

    position:string;

    photoPath:string;

}



export interface MinistryEvaluation {

    ministryId:number;

    ministryName:string;

    ministryHead:string;

    description:string;

    meetingDay:string;

    meetingTime:string;

    meetingLocation:string;

    totalMembers:number;

    members:MinistryMember[];

}



export interface MinistryActivity {

    serviceName:string;

    date:string;

}



export interface MinistryAttendance {

    totalAttendance:number;

    averageAttendance:number;

}



export interface MinistryPerformance {

    leadership:number;

    teamwork:number;

    commitment:number;

}



export interface MinistryEvaluationDetail
extends MinistryEvaluation {

    activities:MinistryActivity[];

    attendance:MinistryAttendance;

    performance:MinistryPerformance;

}



// ======================================
// GET ALL MINISTRY CARDS
// /api/public/ministries/evaluation
// ======================================


export async function getMinistryEvaluations()
:Promise<MinistryEvaluation[]>
{

    const url =
    `${API_BASE_URL}/public/ministries/evaluation`;


    console.log(
        "GET:",
        url
    );


    const response =
    await fetch(
        url,
        {
            method:"GET",
            headers:getAuthHeaders()
        }
    );



    if(!response.ok)
    {

        const error =
        await response.text();


        console.error(
            "MINISTRY LIST ERROR:",
            error
        );


        throw new Error(
            "Failed to load ministry evaluations"
        );

    }



    const data =
    await response.json();



    console.log(
        "MINISTRY LIST:",
        data
    );



    return data;

}



// ======================================
// GET SINGLE MINISTRY EVALUATION
// /api/public/ministries/{id}/evaluation
// ======================================


export async function getMinistryEvaluationDetail(
    ministryId:number
)
:Promise<MinistryEvaluationDetail>
{

    const url =
    `${API_BASE_URL}/public/ministries/${ministryId}/evaluation`;



    console.log(
        "GET DETAIL:",
        url
    );



    const response =
    await fetch(
        url,
        {
            method:"GET",
            headers:getAuthHeaders()
        }
    );



    if(!response.ok)
    {

        const error =
        await response.text();


        console.error(
            "MINISTRY DETAIL ERROR:",
            response.status,
            error
        );


        throw new Error(
            "Failed to load ministry evaluation details"
        );

    }



    const data =
    await response.json();



    console.log(
        "MINISTRY DETAIL RESULT:",
        data
    );



    return data;

}