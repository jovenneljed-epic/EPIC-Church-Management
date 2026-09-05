const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5109/api";


export interface ChurchService {

    churchServiceId: number;

    serviceName: string;

    serviceType: string;

    serviceDate: string;

    startTime: string;

    endTime: string;

    location: string;

    serviceLeader: string;

    speaker: string;

    description: string;

    status: string;

}



export async function getUpcomingChurchServices()
: Promise<ChurchService[]> {


    const response =
        await fetch(

            `${API_BASE_URL}/ChurchServices/public/upcoming`,

            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json"
                }
            }

        );



    if (!response.ok) {


        const error =
            await response.text();


        console.error(
            "Church Service Error:",
            response.status,
            error
        );


        throw new Error(
            "Unable to load church services"
        );

    }



    return await response.json();

}