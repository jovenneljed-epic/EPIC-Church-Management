import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { ministryApi } from "../services/ministryApi";

import type {
    Member,
    Ministry,
    MinistryMember,
    MinistrySummary
} from "../types/ministry";

export const useMinistries = () => {

    // =========================================================
    // STATE
    // =========================================================

    const [ministries, setMinistries] =
        useState<Ministry[]>([]);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [selectedMinistryId, setSelectedMinistryId] =
        useState<number | null>(null);

    const [summary, setSummary] =
        useState<MinistrySummary | null>(null);

    const [ministryMembers, setMinistryMembers] =
        useState<MinistryMember[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [memberLoading, setMemberLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // =========================================================
    // SELECTED MINISTRY
    // =========================================================

    const selectedMinistry = useMemo(
        () =>
            ministries.find(
                ministry =>
                    ministry.ministryId ===
                    selectedMinistryId
            ) ?? null,
        [
            ministries,
            selectedMinistryId
        ]
    );

    // =========================================================
    // LOAD MINISTRIES
    // =========================================================

    const loadMinistries = useCallback(
        async () => {

            try {

                setLoading(true);
                setError("");

                const data =
                    await ministryApi.getMinistries();

                setMinistries(data);

                /*
                 * Only select a ministry automatically
                 * when there is no valid selection.
                 */
                setSelectedMinistryId(
                    currentSelectedId => {

                        const currentExists =
                            currentSelectedId !== null &&
                            data.some(
                                ministry =>
                                    ministry.ministryId ===
                                    currentSelectedId
                            );

                        if (currentExists) {
                            return currentSelectedId;
                        }

                        const firstActive =
                            data.find(
                                ministry =>
                                    ministry.status
                                        ?.toUpperCase() ===
                                    "ACTIVE"
                            );

                        return (
                            firstActive?.ministryId ??
                            data[0]?.ministryId ??
                            null
                        );
                    }
                );

            } catch (err) {

                setMinistries([]);
                setSelectedMinistryId(null);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load ministries."
                );

            } finally {

                setLoading(false);

            }

        },
        []
    );

    // =========================================================
    // LOAD ALL MEMBERS
    // =========================================================

    const loadMembers = useCallback(
        async () => {

            try {

                const data =
                    await ministryApi.getMembers();

                setMembers(data);

            } catch (err) {

                console.error(
                    "Unable to load members:",
                    err
                );

                setMembers([]);

            }

        },
        []
    );

    // =========================================================
    // LOAD SELECTED MINISTRY DATA
    // =========================================================

    const loadMinistryData = useCallback(
        async (ministryId: number) => {

            try {

                setMemberLoading(true);
                setError("");

                /*
                 * Load summary and members at the
                 * same time for better performance.
                 */
                const [
                    summaryData,
                    membersData
                ] = await Promise.all([
                    ministryApi.getMinistrySummary(
                        ministryId
                    ),

                    ministryApi.getMinistryMembers(
                        ministryId
                    )
                ]);

                setSummary(summaryData);

                setMinistryMembers(
                    membersData
                );

            } catch (err) {

                console.error(
                    "Unable to load ministry data:",
                    err
                );

                setSummary(null);
                setMinistryMembers([]);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load ministry data."
                );

            } finally {

                setMemberLoading(false);

            }

        },
        []
    );

    // =========================================================
    // CLEAR MINISTRY DATA
    // =========================================================

    const clearMinistryData = useCallback(() => {

        setSummary(null);
        setMinistryMembers([]);

    }, []);

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        const initialize = async () => {

            await Promise.all([
                loadMinistries(),
                loadMembers()
            ]);

        };

        initialize();

    }, [
        loadMinistries,
        loadMembers
    ]);

    // =========================================================
    // LOAD DATA WHEN MINISTRY CHANGES
    // =========================================================

    useEffect(() => {

        if (selectedMinistryId === null) {

            clearMinistryData();

            return;

        }

        loadMinistryData(
            selectedMinistryId
        );

    }, [
        selectedMinistryId,
        loadMinistryData,
        clearMinistryData
    ]);

    // =========================================================
    // RETURN
    // =========================================================

    return {

        // Data
        ministries,
        members,
        summary,
        ministryMembers,

        // Selection
        selectedMinistryId,
        setSelectedMinistryId,
        selectedMinistry,

        // Loading
        loading,
        memberLoading,

        // Error
        error,
        setError,

        // Actions
        loadMinistries,
        loadMembers,
        loadMinistryData,
        clearMinistryData
    };
};