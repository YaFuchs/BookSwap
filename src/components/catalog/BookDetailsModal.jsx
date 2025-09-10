
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookDetails from "../shared/BookDetails";
import AvailabilityAndBasket from "../shared/AvailabilityAndBasket";
import BookModalListingStatusSection from "./BookModalListingStatusSection";
import BookModalContentManagerActions from "./BookModalContentManagerActions";
import { useBookDetails } from "../hooks/useBookDetails";
import { useAppNotifications } from "../hooks/useAppNotifications";

export default function BookDetailsModal({
  book,
  open,
  onOpenChange,
  GRADES,
  user,
  onBookDeleted,
  onBookUpdated, // Receive the new prop
  modalAction,
  onBookPublished,
  availableCounts,
  isBookInBasket,
  basketActionLoading,
  onAddToBasket,
  onRemoveFromBasket,
  onBookCatalogDataChange
}) {
    // Add the notifications hook
    const notify = useAppNotifications();

    // All state and logic is now encapsulated in the useBookDetails hook.
    const {
        currentUser,
        loadingSubmission,
        isBookListed,
        isLoadingCheck,
        isEditMode, setIsEditMode,
        editFormData, setEditFormData,
        userSpecificListing,
        userSpecificListingLoading,
        loadingDelete,
        isFastPublishing,
        handleGranularUpdate,
        handleListingUpdate,
        handleCancelForm,
        handleSaveBookForm,
        handleRemoveFromCatalog,
        handleFastPublishFromModal
    } = useBookDetails(
        book,
        open,
        user,
        modalAction,
        onOpenChange,
        onBookCatalogDataChange,
        onBookDeleted,
        onBookPublished,
        notify, // Pass notify to the hook
        onBookUpdated // Pass the new prop to the hook
    );

    const isAddingNewBook = modalAction === 'add';
    const count = book && availableCounts ? availableCounts[book.id] || 0 : 0;

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                dir="rtl"
                className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <DialogHeader className="text-right">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {isAddingNewBook ? "הוספת ספר חדש" : (isEditMode ? 'עריכת פרטי הספר' : 'פרטי הספר')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-6">
                    {/* Component for core book details (view/edit) */}
                    <div>
                        <BookDetails
                            book={book}
                            GRADES={GRADES}
                            isEditMode={isEditMode}
                            editFormData={editFormData}
                            setEditFormData={setEditFormData}
                            isAddingNewBook={isAddingNewBook}
                        />
                    </div>

                    {/* Component for availability and basket actions (view mode only) */}
                    {!isEditMode && !isAddingNewBook && (
                        <div className="flex justify-center md:justify-start">
                            <div className="w-full max-w-xs">
                                <AvailabilityAndBasket
                                    currentUser={currentUser}
                                    count={count}
                                    isBookInBasket={isBookInBasket}
                                    basketActionLoading={basketActionLoading}
                                    onAddToBasket={onAddToBasket}
                                    onRemoveFromBasket={onRemoveFromBasket}
                                />
                            </div>
                        </div>
                    )}

                    {/* Component for managing the user's own listing for this book */}
                    <BookModalListingStatusSection
                        isEditMode={isEditMode}
                        isAddingNewBook={isAddingNewBook}
                        isLoadingCheck={isLoadingCheck}
                        isBookListed={isBookListed}
                        userSpecificListingLoading={userSpecificListingLoading}
                        userSpecificListing={userSpecificListing}
                        currentUser={currentUser}
                        book={book}
                        isFastPublishing={isFastPublishing}
                        onFastPublish={handleFastPublishFromModal}
                        onListingUpdate={handleListingUpdate}
                        onGranularUpdate={handleGranularUpdate}
                    />

                    {/* Component for content manager specific actions */}
                    <BookModalContentManagerActions
                        user={user}
                        book={book}
                        isAddingNewBook={isAddingNewBook}
                        isEditMode={isEditMode}
                        onSetIsEditMode={setIsEditMode}
                        onBookDeleted={onBookDeleted}
                        onBookCatalogDataChange={onBookCatalogDataChange}
                        loadingDelete={loadingDelete}
                        onRemoveFromCatalog={handleRemoveFromCatalog}
                    />

                    {/* Footer buttons for edit/add mode */}
                    {isEditMode && (
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <Button variant="ghost" onClick={handleCancelForm} disabled={loadingSubmission}>
                                <X className="h-4 w-4 ml-1" /> ביטול
                            </Button>
                            <Button onClick={handleSaveBookForm} disabled={loadingSubmission}>
                                {loadingSubmission && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4 ml-1" /> {isAddingNewBook ? "הוספה" : "שמירת שינויים"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
