import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function ActiveMobileFilters({
    filters,
    showMyBasketOnly,
    showMyBooksOnly,
    resetFilters,
    GRADES,
    hasActiveFilters
}) {
    if (!hasActiveFilters) {
        return null;
    }

    const activeFilterBadges = [];

    if (showMyBasketOnly) {
        activeFilterBadges.push(<Badge key="my-basket" variant="secondary" className="bg-orange-100 text-orange-800">הסל שלי</Badge>);
    } else if (showMyBooksOnly) {
        activeFilterBadges.push(<Badge key="my-books" variant="secondary" className="bg-blue-100 text-blue-800">ספרים שפירסמתי</Badge>);
    } else {
        if (filters.title_q && filters.title_q.trim().length > 0) {
            activeFilterBadges.push(<Badge key="search-term" variant="secondary">חיפוש: "{filters.title_q}"</Badge>);
        }
        if (Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0) {
            const gradeNames = filters.grade_numbers
                .map(gradeId => {
                    const grade = GRADES.find(g => g.id === gradeId);
                    return grade ? grade.name.replace('כיתה ', '') : null;
                })
                .filter(Boolean)
                .join(', ');
            activeFilterBadges.push(<Badge key="grades" variant="secondary">שכבות: {gradeNames}</Badge>);
        }
    }

    if (activeFilterBadges.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">סינון פעיל:</span>
                <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    size="sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    נקה סינון
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {activeFilterBadges}
            </div>
        </div>
    );
}