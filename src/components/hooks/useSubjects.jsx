import { useState, useEffect, useCallback } from "react";
import { getPublicSubjects } from "@/api/functions"; // Changed to public function

export function useSubjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubjects = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getPublicSubjects(); // Changed to public function
            setSubjects(response.data || []);
        } catch (err) {
            console.error("Error fetching subjects:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        return fetchSubjects();
    }, [fetchSubjects]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return {
        subjects,
        loading,
        error,
        refetch
    };
}