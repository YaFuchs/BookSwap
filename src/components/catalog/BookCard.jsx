import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import BookAvailabilityBadge from "../common/BookAvailabilityBadge";
import BookCardListingButtons from "./BookCardListingButtons";
import BookCardBasketButtons from "./BookCardBasketButtons";

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
  onEditListing,
  onAddToBasket, 
  onRemoveFromBasket 
}) {
  const count = availableCounts[book.id] || 0;
  const bookListed = isBookListed(book.id);
  const bookInBasket = isBookInBasket(book.id);
  const isActionLoading = actionLoading[book.id];
  const isBasketActionLoading = actionLoading[`basket-${book.id}`];

  // Memoize click handler to prevent unnecessary re-renders
  const handleCardClick = useCallback((e) => {
    if (e.target.closest('button, [data-radix-tooltip-trigger]')) return;
    onRowClick(book);
  }, [onRowClick, book]);

  // Memoize action handlers to prevent unnecessary re-renders
  const handlePublishClick = useCallback((e) => {
    e.stopPropagation();
    onFastPublish(book);
  }, [onFastPublish, book]);

  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    onEditListing(book);
  }, [onEditListing, book]);

  const handleAddBasketClick = useCallback((e) => {
    e.stopPropagation();
    onAddToBasket(book);
  }, [onAddToBasket, book]);

  const handleRemoveBasketClick = useCallback((e) => {
    e.stopPropagation();
    onRemoveFromBasket(book);
  }, [onRemoveFromBasket, book]);

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
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
                <BookAvailabilityBadge count={count} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {user && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <BookCardListingButtons
              isListed={bookListed}
              isLoading={isActionLoading}
              onEdit={handleEditClick}
              onPublish={handlePublishClick}
            />
            <BookCardBasketButtons
              isInBasket={bookInBasket}
              isLoading={isBasketActionLoading}
              onAddToBasket={handleAddBasketClick}
              onRemoveFromBasket={handleRemoveBasketClick}
            />
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