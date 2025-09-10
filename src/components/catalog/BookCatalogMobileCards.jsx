import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import BookCard from "./BookCard";

export default function BookCatalogMobileCards({
  filteredBooks,
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
  onRemoveFromBasket,
  showMyBasketEmptyState,
  showMyBooksEmptyState,
  showEmptyCatalogState,
  showNoResultsState,
  resetFilters
}) {
  return (
    <>
      {filteredBooks.length > 0 ? (
        <div className="space-y-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              GRADES={GRADES}
              user={user}
              availableCounts={availableCounts}
              isBookListed={isBookListed}
              isBookInBasket={isBookInBasket}
              actionLoading={actionLoading}
              onRowClick={onRowClick}
              onFastPublish={onFastPublish}
              onEditListing={onEditListing}
              onAddToBasket={onAddToBasket}
              onRemoveFromBasket={onRemoveFromBasket}
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {showMyBasketEmptyState ? (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">הסל שלכם ריק</h3>
                <p className="text-gray-500">הוסיפו לסל ספרים שאתם מעוניינים להשיג</p>
              </>
            ) : showMyBooksEmptyState ? (
              <>
                <h3 className="text-xl font-semibold text-gray-700">לא פרסמת ספרים למכירה</h3>
                <p className="text-gray-500">פרסמו ספרים מהקטלוג כדי שיופיעו כאן</p>
                <Button variant="outline" onClick={resetFilters} className="mt-4">
                  עיון בקטלוג
                </Button>
              </>
            ) : showEmptyCatalogState ? (
              <p className="text-gray-500">אין ספרים בקטלוג.</p>
            ) : showNoResultsState ? (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">לא נמצאו ספרים</h3>
                <p className="text-gray-500">נסו לשנות את הסינונים או לחפש משהו אחר</p>
                <Button variant="outline" onClick={resetFilters} className="mt-4">איפוס החיפוש</Button>
              </>
            ) : (
              // Default fallback if logic is missed
              <p className="text-gray-500">אין ספרים בקטלוג.</p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}