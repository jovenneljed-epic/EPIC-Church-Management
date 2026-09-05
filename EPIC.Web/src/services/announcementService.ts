const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://localhost:7001/api";


export interface Announcement {

    id: number;

    title: string;

    content: string;

    category: string;

    imageUrl: string | null;

    isPublished: boolean;

    publishDate: string;

    createdDate: string;

}



export async function getAnnouncements()
: Promise<Announcement[]> {


    const token =
        localStorage.getItem("token");


    const response = await fetch(

        `${API_BASE_URL}/announcements`,

        {
            headers: {

                Authorization:
                    `Bearer ${token}`

            }

        }

    );


    if (!response.ok) {

        throw new Error(
            "Failed to load announcements"
        );

    }


    return await response.json();

}