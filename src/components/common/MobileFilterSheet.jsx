
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, RotateCcw, ChevronDown, ChevronUp, X } from "lucide-react";
import { useAppStore } from '@/components/stores/useAppStore';

export default function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  setFilters,
  handleFilterGradeToggle,
  removeFilterGrade,
  showMyBooksOnly,
  handleMyBooksToggle,
  userListingsCount = 0,
  showMyBasketOnly,
  handleMyBasketToggle,
  userBasketCount = 0,
  resetFilters,
  user,
  GRADES,
  hasActiveFilters
}) {
  const [isGradeSelectionExpanded, setIsGradeSelectionExpanded] = React.useState(false);

  // Get the debounced setter from store for consistent behavior
  const { setTitleQDebounced } = useAppStore();

  const handleResetAndClose = () => {
    resetFilters();
    onOpenChange(false);
  };

  const handleMyBooksClick = () => {
    handleMyBooksToggle();
    onOpenChange(false);
  };

  const handleMyBasketClick = () => {
    handleMyBasketToggle();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-lg"
        dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}>

        <SheetHeader className="text-right mb-4">
          <SheetTitle>סינון וחיפוש</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-1 pb-6 overflow-y-auto max-h-[70vh]">
          {/* Search Input */}
          <div className="relative w-full">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="חפשו שם ספר..."
              value={filters.title_q}
              onChange={(e) => setTitleQDebounced(e.target.value)}
              className="pr-10 w-full" />

          </div>

          {/* Grade Selection - Expandable Section */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="flex items-center justify-between w-full"
              onClick={() => setIsGradeSelectionExpanded(!isGradeSelectionExpanded)}>

              <span>
                {filters.grade_numbers.length > 0 ? `נבחרו ${filters.grade_numbers.length} שכבות` : 'שכבת לימוד'}
              </span>
              {isGradeSelectionExpanded ?
                <ChevronUp className="w-4 h-4" /> :
                <ChevronDown className="w-4 h-4" />
              }
            </Button>

            {isGradeSelectionExpanded &&
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-sm mb-3">בחירת שכבות לימוד</h4>
                <div className="grid grid-cols-3 gap-3">
                  {GRADES.map((grade) =>
                    <div key={grade.id} className="flex items-center gap-2 flex-row-reverse">
                      <Checkbox
                        id={`mobile-filter-grade-${grade.id}`}
                        checked={filters.grade_numbers.includes(grade.id)}
                        onCheckedChange={() => handleFilterGradeToggle(grade.id)} />

                      <label htmlFor={`mobile-filter-grade-${grade.id}`} className="text-sm cursor-pointer">
                        {grade.name.replace('כיתה ', '')}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            }
          </div>

          {/* Grade Badges */}
          {Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0 &&
            <div className="flex flex-wrap gap-2">
              {filters.grade_numbers.map((gradeId) => {
                const grade = GRADES.find((g) => g.id === gradeId);
                return grade ?
                  <Badge key={gradeId} variant="secondary" className="flex items-center gap-1">
                    {grade.name.replace('כיתה ', '')}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeFilterGrade(gradeId)} />
                  </Badge> :
                  null;
              })}
            </div>
          }

          {/* User Specific Toggles */}
          {user &&
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleMyBooksClick}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  showMyBooksOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }>

                ספרים שפירסמתי ({userListingsCount})
              </Button>
              <Button
                onClick={handleMyBasketClick}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  showMyBasketOnly ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }>

                הסל שלי ({userBasketCount})
              </Button>
            </div>
          }
        </div>

        <SheetFooter className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleResetAndClose}
              className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">

              <RotateCcw className="w-4 h-4 mr-2" /> נקה סינון
            </Button>
          )}
          <SheetClose asChild>
            <Button className="flex-1">הצג תוצאות</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
