import { useState, useEffect, useCallback } from "react";
import { getPublicGrades } from "@/api/functions";
import { listAllGradesForManager } from "@/api/functions";

export function useGrades(includeInactive = false) {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGrades = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use appropriate function based on whether inactive grades are needed
            const response = includeInactive 
                ? await listAllGradesForManager()
                : await getPublicGrades();
                
            setGrades(response.data || []);
        } catch (err) {
            console.error("Error fetching grades:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [includeInactive]);

    const refetch = useCallback(() => {
        return fetchGrades();
    }, [fetchGrades]);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    return {
        grades,
        loading,
        error,
        refetch
    };
}