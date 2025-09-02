
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, BookOpenCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BookCard({ 
  book, 
  GRADES, 
  user, 
  availableCounts, 
  isBookListed, 
  isBookInBasket, 
  actionLoading, 
  onRowClick, 
  onFastPublish, 
  onEditListing, // Changed from onFastRemove
  onAddToBasket, 
  onRemoveFromBasket 
}) {
  const count = availableCounts[book.id] || 0;
  const bookListed = isBookListed(book.id);
  const bookInBasket = isBookInBasket(book.id);
  const isActionLoading = actionLoading[book.id];
  const isBasketActionLoading = actionLoading[`basket-${book.id}`];

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => {
        if (e.target.closest('button, [data-radix-tooltip-trigger]')) return;
        onRowClick(book);
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Book Image */}
          <div className="flex-shrink-0">
            {book.cover_image_url ? (
              <img 
                src={book.cover_image_url} 
                alt={book.title_he} 
                className="w-16 h-20 object-cover rounded" 
              />
            ) : (
              <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{book.title_he}</h3>
              
              {/* Subject */}
              {book.subject && (
                <p className="text-sm text-gray-600">{book.subject}</p>
              )}
              
              {/* Grades */}
              <div className="flex flex-wrap gap-1">
                {Array.isArray(book.grade_numbers) && book.grade_numbers.slice(0, 4).map(gradeNum => {
                  const grade = GRADES.find(g => g.id === gradeNum);
                  return grade ? (
                    <Badge key={gradeNum} variant="secondary" className="text-xs">
                      {grade.name}
                    </Badge>
                  ) : null;
                })}
                {Array.isArray(book.grade_numbers) && book.grade_numbers.length > 4 && (
                  <span className="text-xs text-gray-500">+{book.grade_numbers.length - 4}</span>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">זמינים ביריד:</span>
                {count > 0 ? (
                  <Badge className="bg-green-100 text-green-800 text-sm flex items-center gap-1.5 max-w-[65px] justify-center">
                    <BookOpenCheck className="w-4 h-4" />
                    <span className="truncate">{count}</span>
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">אין במלאי</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {user && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            {/* Listing Actions */}
            {bookListed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditListing(book); // Changed from onFastRemove
                    }}
                    disabled={isActionLoading}
                    className="bg-green-600 hover:bg-green-700 text-xs flex-1" // Changed variant
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "ערוך פרסום" // Changed text
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-right">ניתן לערוך את פרטי המודעה</p> {/* Changed tooltip text */}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFastPublish(book);
                    }}
                    disabled={isActionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-xs flex-1"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "פרסם ביריד"
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-right">אם הספר הזה נמצא ברשותך, את.ה יכול.ה לפרסם אותו ביריד הספרים הדיגיטלי וכך להציע אותו למסירה או מכירה לאחרים</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Basket Actions */}
            {bookInBasket ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromBasket(book);
                    }}
                    disabled={isBasketActionLoading}
                    className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 flex-1"
                  >
                    {isBasketActionLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "הסר מהסל"
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-right">הסר ספר זה מרשימת הספרים שאני מעוניין לקנות</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToBasket(book);
                    }}
                    disabled={isBasketActionLoading}
                    className="text-xs border-green-300 text-green-600 hover:bg-green-50 flex-1"
                  >
                    {isBasketActionLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "הוסף לסל"
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-right">הוסף ספר זה לרשימת הספרים שאני מעוניינ.ת לקנות</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        
        {!user && (
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">התחבר לפעולות</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
