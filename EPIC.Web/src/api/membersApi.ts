import { apiClient } from "./apiClient";

export interface Member {
    memberId: number;
    memberCode: string;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    gender: string;
    birthDate: string;
    contactNumber: string;
    address: string;
    civilStatus: string;
    ministry: string;
    dateJoined: string;
    status: string;
    photoPath: string;
    createdDate: string;
    updatedDate: string | null;
}

// ============================================================
// GET MEMBERS
// ============================================================

export async function getMembers(): Promise<Member[]> {

    const response = await apiClient(
        "/Members"
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            "Unable to load members."
        );
    }

    return data;
}

// ============================================================
// GET MEMBER
// ============================================================

export async function getMember(
    id: number
): Promise<Member> {

    const response = await apiClient(
        `/Members/${id}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            "Unable to load member."
        );
    }

    return data;
}

// ============================================================
// SEARCH MEMBERS
// ============================================================

export async function searchMembers(
    name: string
): Promise<Member[]> {

    const response = await apiClient(
        `/Members/search?name=${encodeURIComponent(name)}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            "Unable to search members."
        );
    }

    return data;
}