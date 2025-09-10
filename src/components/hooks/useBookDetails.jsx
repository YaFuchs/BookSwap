
import { useState, useEffect, useCallback } from "react";
import { User, Listing, Book } from "@/api/entities";
import { createBook } from "@/api/functions";
import { updateBook } from "@/api/functions";

export function useBookDetails(
    book,
    open,
    user,
    modalAction,
    onOpenChange,
    onBookCatalogDataChange,
    onBookDeleted,
    onBookPublished,
    notify, // Add notify as a parameter
    onBookUpdated // Add the new callback for updates
) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [isBookListed, setIsBookListed] = useState(false);
    const [isLoadingCheck, setIsLoadingCheck] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [userSpecificListing, setUserSpecificListing] = useState(null);
    const [userSpecificListingLoading, setUserSpecificListingLoading] = useState(false);

    // State for actions, now managed by the hook
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [isFastPublishing, setIsFastPublishing] = useState(false);

    const isAddingNewBook = modalAction === 'add';

    useEffect(() => {
        if (open) {
            if (isAddingNewBook) {
                setEditFormData({ title_he: "", subject: "", cover_image_url: "", grade_numbers: [], recommended_price: 2000, admin_note: "" });
                setIsEditMode(true);
                setIsLoadingCheck(false);
                setCurrentUser(user); // Assume current user is passed for "add" mode
            } else if (book) {
                setEditFormData({
                    title_he: book.title_he || "",
                    subject: book.subject || "",
                    cover_image_url: book.cover_image_url || "",
                    grade_numbers: book.grade_numbers ? [...book.grade_numbers] : [],
                    recommended_price: book.recommended_price ?? 2000,
                    admin_note: book.admin_note || "",
                });
                setIsEditMode(false);

                const checkListingStatus = async () => {
                    setIsLoadingCheck(true);
                    setUserSpecificListingLoading(true); // Start loading for specific listing
                    try {
                        const user = await User.me();
                        setCurrentUser(user);
                        if (user) {
                            const userListings = await Listing.filter({ seller_id: user.id });
                            const foundListing = userListings.find(listing =>
                                listing.book_id === book.id && listing.status === 'available'
                            );
                            setIsBookListed(!!foundListing); // Update existing state

                            if (foundListing) {
                                // Fetch the full specific listing details with book data
                                const specificListingArray = await Listing.filter({ id: foundListing.id });
                                if (specificListingArray.length > 0) {
                                    const specificListing = {
                                        ...specificListingArray[0],
                                        book: book, // Attach the book data
                                        seller: user, // Attach the seller data
                                        isCurrentUserListing: true // Mark as current user's listing
                                    };
                                    setUserSpecificListing(specificListing);
                                } else {
                                    setUserSpecificListing(null);
                                }
                            } else {
                                setUserSpecificListing(null);
                            }
                        } else {
                            setIsBookListed(false);
                            setUserSpecificListing(null);
                        }
                    } catch (error) {
                        setCurrentUser(null);
                        setIsBookListed(false);
                        setUserSpecificListing(null);
                    } finally {
                        setIsLoadingCheck(false);
                        setUserSpecificListingLoading(false); // Finish loading for specific listing
                    }
                };
                checkListingStatus();
            }
        }
    }, [open, book, isAddingNewBook, user]);

    // --- Action Handlers moved into the hook ---

    const handleGranularUpdate = useCallback((updatedListing) => {
        // Update local state immediately for UI responsiveness
        setUserSpecificListing(updatedListing);
    }, []); // setUserSpecificListing is a stable reference

    const handleListingUpdate = useCallback(() => {
        // When listing is deleted or major changes occur, refresh status
        setUserSpecificListing(null);
        setIsBookListed(false);
        if (onBookCatalogDataChange) {
            onBookCatalogDataChange();
        }
    }, [onBookCatalogDataChange]);

    const handleCancelForm = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    const handleSaveBookForm = useCallback(async () => {
        if (!editFormData.title_he.trim()) {
            notify.error("שדה חובה חסר", "שם הספר הוא שדה חובה.");
            return;
        }
        if (editFormData.grade_numbers.length === 0) {
            notify.error("שדה חובה חסר", "יש לבחור לפחות שכבה אחת.");
            return;
        }

        setLoadingSubmission(true);
        try {
            if (isAddingNewBook) {
                await createBook({ bookData: editFormData });
                notify.success("הספר נוסף בהצלחה!", "הספר נוסף לקטלוג.");
                // For new books, a general refresh is okay as it's a new entry
                if (onBookCatalogDataChange) onBookCatalogDataChange();
                onOpenChange(false);
            } else {
                const response = await updateBook({ bookId: book.id, updateData: editFormData });
                const updatedBook = response.data; // The backend now returns the updated book
                notify.success("הספר עודכן בהצלחה!", "השינויים נשמרו.");
                if (onBookUpdated) {
                    onBookUpdated(updatedBook); // Use the new granular update callback
                } else {
                    onOpenChange(false); // Fallback to just closing the modal
                }
            }
            setIsEditMode(false);
        } catch (error) {
            console.error("שגיאה בשמירת ספר:", error);
            notify.error("שגיאה בשמירת שינויים", error.message);
        } finally {
            setLoadingSubmission(false);
        }
    }, [isAddingNewBook, editFormData, book, onOpenChange, onBookCatalogDataChange, notify, onBookUpdated]);

    const handleRemoveFromCatalog = useCallback(async () => {
        if (!book || !currentUser?.is_content_manager) return;

        if (window.confirm(`האם אתה בטוח שברצונך להסיר את הספר "${book.title_he}" מהקטלוג? הספר לא יוצג יותר בקטלוג אך ישמר במודעות הקיימות של המשתמשים.`)) {
            setLoadingDelete(true);
            try {
                await updateBook({ bookId: book.id, updateData: { status: "removed_from_catalog" } });
                notify.success("הספר הוסר בהצלחה", "הספר הוסר מהקטלוג.");
                if (onBookDeleted) {
                    onBookDeleted(book.id); // Call the callback with the book's ID
                } else {
                    onOpenChange(false); // Fallback to just closing the modal
                }
            } catch (error) {
                console.error("שגיאה בהסרת הספר מהקטלוג:", error);
                notify.error("שגיאה בהסרת הספר מהקטלוג", error.message);
            } finally {
                setLoadingDelete(false);
            }
        }
    }, [book, currentUser, onBookDeleted, onOpenChange, notify]);

    const handleFastPublishFromModal = useCallback(async () => {
        if (!currentUser || !book || isFastPublishing || loadingSubmission) return;

        setIsFastPublishing(true);
        try {
            const fullBookRecord = await Book.get(book.id);
            const recommendedPrice = fullBookRecord?.recommended_price ?? 2000;
            const newListing = await Listing.create({
                book_id: book.id,
                seller_id: currentUser.id,
                price_agorot: recommendedPrice,
                condition_note: "",
                status: "available",
                city: currentUser.city
            });
            const newSpecificListing = { ...newListing, book: book, seller: currentUser, isCurrentUserListing: true };
            
            // Logic from handleNewListingCreated is now here
            setUserSpecificListing(newSpecificListing);
            setIsBookListed(true);
            if (onBookPublished) {
                onBookPublished();
            }

        } catch (error) {
            console.error("Error fast publishing listing:", error);
            notify.error("שגיאה בהוספת הספר", error.message);
        } finally {
            setIsFastPublishing(false);
        }
    }, [currentUser, book, isFastPublishing, loadingSubmission, onBookPublished, notify]);

    return {
        currentUser,
        loadingSubmission,
        isBookListed,
        isLoadingCheck,
        isEditMode,
        setIsEditMode,
        editFormData,
        setEditFormData,
        userSpecificListing,
        setUserSpecificListing,
        userSpecificListingLoading,
        loadingDelete,
        isFastPublishing,

        // Handlers
        handleGranularUpdate,
        handleListingUpdate,
        handleCancelForm,
        handleSaveBookForm,
        handleRemoveFromCatalog,
        handleFastPublishFromModal
    };
}
