import { getPublicGrades } from "@/api/functions";

// Cache for grades to avoid repeated API calls
let cachedGrades = null;
let gradesPromise = null;

// Fallback static grades (used as backup if API fails)
const FALLBACK_GRADES = Array.from({ length: 12 }, (_, i) => {
    const gradeNumber = i + 1;
    let name;
    if (gradeNumber <= 10) {
        name = `כיתה ${String.fromCharCode(1488 + i)}'`;
    } else if (gradeNumber === 11) {
        name = `כיתה יא'`;
    } else if (gradeNumber === 12) {
        name = `כיתה יב'`;
    }
    return {
        id: gradeNumber,
        name: name,
    };
});

// Function to fetch grades dynamically
export const fetchGrades = async () => {
    // Return cached grades if available
    if (cachedGrades) {
        return cachedGrades;
    }

    // Return existing promise if already fetching
    if (gradesPromise) {
        return gradesPromise;
    }

    gradesPromise = (async () => {
        try {
            const response = await getPublicGrades();
            if (response && response.data && Array.isArray(response.data)) {
                // Transform the API response to match the expected format
                const dynamicGrades = response.data.map(grade => ({
                    id: grade.grade_number,
                    name: grade.label
                }));
                
                cachedGrades = dynamicGrades;
                return dynamicGrades;
            } else {
                console.warn("Invalid response from getPublicGrades, using fallback grades");
                cachedGrades = FALLBACK_GRADES;
                return FALLBACK_GRADES;
            }
        } catch (error) {
            console.error("Error fetching grades, using fallback grades:", error);
            cachedGrades = FALLBACK_GRADES;
            return FALLBACK_GRADES;
        } finally {
            gradesPromise = null;
        }
    })();

    return gradesPromise;
};

// Function to get cached grades synchronously (returns fallback if not cached)
export const getCachedGrades = () => {
    return cachedGrades || FALLBACK_GRADES;
};

// Function to clear the cache (useful for testing or when grades are updated)
export const clearGradesCache = () => {
    cachedGrades = null;
    gradesPromise = null;
};

// Backward compatibility: Export the fallback grades as GRADES
// Components that need dynamic grades should use fetchGrades() instead
export const GRADES = FALLBACK_GRADES;

// Initialize grades cache on module load
fetchGrades().catch(console.error);