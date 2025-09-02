
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Trash2, Edit, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Listing, User, Book } from "@/api/entities";
import { createBook } from "@/api/functions";
import { updateBook } from "@/api/functions";
import UserListingDetails from "../shared/UserListingDetails";
import BookDetails from "../shared/BookDetails";
import AvailabilityAndBasket from "../shared/AvailabilityAndBasket";

export default function BookDetailsModal({ 
  book, 
  open, 
  onOpenChange, 
  GRADES, 
  user, 
  onBookDeleted, 
  modalAction, 
  onBookPublished,
  availableCounts,
  isBookInBasket,
  basketActionLoading,
  onAddToBasket,
  onRemoveFromBasket
}) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [isBookListed, setIsBookListed] = useState(false);
    const [isLoadingCheck, setIsLoadingCheck] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [isContentManagerSectionExpanded, setIsContentManagerSectionExpanded] = useState(false);
    
    // New state variables for user's specific listing
    const [userSpecificListing, setUserSpecificListing] = useState(null);
    const [userSpecificListingLoading, setUserSpecificListingLoading] = useState(false);

    const isAddingNewBook = modalAction === 'add';
    const count = book && availableCounts ? availableCounts[book.id] || 0 : 0;

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
                    recommended_price: book.recommended_price || 2000,
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

    // Handle granular updates from UserListingDetails
    const handleGranularUpdate = (updatedListing) => {
        // Update local state immediately for UI responsiveness
        setUserSpecificListing(updatedListing);
    };

    const handleListingUpdate = () => {
        // When listing is deleted or major changes occur, we might want to refresh the entire check
        // For now, we'll clear the specific listing and reload the status
        setUserSpecificListing(null);
        setIsBookListed(false);
        
        // Trigger refresh of parent page when listing is deleted
        if (onBookPublished) {
            onBookPublished();
        }
        
        // Trigger a re-check of the listing status
        if (book && user) {
            const recheckListing = async () => {
                try {
                    // Re-fetch user listings to ensure we get the most up-to-date status
                    const userListings = await Listing.filter({ seller_id: user.id });
                    const foundListing = userListings.find(listing => 
                        listing.book_id === book.id && listing.status === 'available'
                    );
                    setIsBookListed(!!foundListing);
                    if (!foundListing) {
                        setUserSpecificListing(null);
                    }
                } catch (error) {
                    console.error("Error rechecking listing status:", error);
                }
            };
            recheckListing();
        }
    };
    
    const handleFastPublishFromModal = async () => {
        if (!currentUser || !book || loadingSubmission) {
            return;
        }

        setLoadingSubmission(true);
        try {
            // Fetch the full book record to get the recommended_price
            const fullBookRecord = await Book.get(book.id);
            const recommendedPrice = fullBookRecord?.recommended_price || 2000; // Fallback to 2000 if missing

            const newListing = await Listing.create({
                book_id: book.id,
                seller_id: currentUser.id,
                price_agorot: recommendedPrice, // Use recommended price instead of null
                condition_note: "",
                status: "available",
                city: currentUser.city
            });

            // Construct the full object needed for UserListingDetails and update the UI
            const newSpecificListing = {
                ...newListing,
                book: book,
                seller: currentUser,
                isCurrentUserListing: true
            };
            setUserSpecificListing(newSpecificListing);
            setIsBookListed(true);

            // Trigger refresh of parent page data
            if (onBookPublished) {
                onBookPublished();
            }

        } catch (error) {
            console.error("Error fast publishing listing:", error);
            alert("שגיאה בהוספת הספר: " + error.message);
        } finally {
            setLoadingSubmission(false);
        }
    };

    const handleRemoveFromCatalog = async () => {
        if (!book || !user?.is_content_manager) return;

        if (window.confirm(`האם אתה בטוח שברצונך להסיר את הספר "${book.title_he}" מהקטלוג? הספר לא יוצג יותר בקטלוג אך ישמר במודעות הקיימות של המשתמשים.`)) {
            setLoadingDelete(true);
            try {
                await updateBook({ bookId: book.id, updateData: { status: "removed_from_catalog" } });
                if (onBookDeleted) {
                    onBookDeleted();
                }
                alert("הספר הוסר בהצלחה מהקטלוג.");
            } catch (error) {
                console.error("שגיאה בהסרת הספר מהקטלוג:", error);
                alert("שגיאה בהסרת הספר מהקטלוג: " + error.message);
            } finally {
                setLoadingDelete(false);
            }
        }
    };

    const handleCancelForm = () => {
        onOpenChange(false);
    };

    const handleSaveBookForm = async () => {
        if (!editFormData.title_he.trim()) {
            alert("שם הספר הוא שדה חובה.");
            return;
        }
        if (editFormData.grade_numbers.length === 0) {
            alert("יש לבחור לפחות שכבה אחת.");
            return;
        }

        setLoadingSubmission(true);
        try {
            if (isAddingNewBook) {
                await createBook({ bookData: editFormData });
                alert("הספר נוסף בהצלחה!");
            } else {
                await updateBook({ bookId: book.id, updateData: editFormData });
                alert("הספר עודכן בהצלחה!");
            }
            setIsEditMode(false);
            if (onBookDeleted) { // This `onBookDeleted` prop seems to also handle data refresh for the parent.
                onBookDeleted();
            }
            onOpenChange(false);
        } catch (error) {
            console.error("שגיאה בשמירת ספר:", error);
            alert("שגיאה בשמירת שינויים: " + error.message);
        } finally {
            setLoadingSubmission(false);
        }
    };

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

                    {/* AvailabilityAndBasket - positioned separately with width constraints */}
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

                    {!isEditMode && !isAddingNewBook && (
                        <AnimatePresence>
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isLoadingCheck ? (
                                    <div className="bg-blue-50 rounded-xl p-6 text-center mt-8">
                                        <div className="flex justify-center items-center h-24">
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                    </div>
                                ) : isBookListed ? (
                                    userSpecificListingLoading ? (
                                        <div className="bg-blue-50 rounded-xl p-6 text-center mt-8">
                                            <div className="flex justify-center items-center h-24">
                                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                            </div>
                                        </div>
                                    ) : userSpecificListing ? (
                                        <UserListingDetails 
                                            listing={userSpecificListing} 
                                            onListingUpdate={handleListingUpdate}
                                            onGranularUpdate={handleGranularUpdate}
                                        />
                                    ) : (
                                        <div className="bg-blue-50 rounded-xl p-6 text-center mt-8">
                                            <div className="flex flex-col items-center justify-center h-24 text-green-700">
                                                <CheckCircle2 className="w-8 h-8 mb-2" />
                                                <p className="font-semibold text-sm">ספר זה נמצא בספרים שפירסמת ביריד הספרים</p>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-blue-50 rounded-xl p-6 text-center mt-8">
                                        <p className="text-blue-800 font-medium text-sm mb-2">
                                            מעוניינים למסור או למכור את הספר הזה?
                                        </p>
                                        
                                        <Button
                                            onClick={handleFastPublishFromModal}
                                            className="mt-4 bg-green-600 hover:bg-green-700"
                                            disabled={!currentUser || loadingSubmission}
                                        >
                                            {loadingSubmission && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                            הוסף את הספר הזה לפרסום ביריד
                                        </Button>
                                        
                                        {!currentUser && <p className="text-xs text-gray-500 mt-2">עליך להיות מחובר כדי להוסיף ספרים.</p>}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Content Manager Actions Section */}
                    {user?.is_content_manager && !isAddingNewBook && !isEditMode && (
                        <div className="border-t border-gray-200 pt-6 mt-8">
                            <div className="bg-orange-50 rounded-lg border border-orange-200 transition-all">
                                <button
                                    onClick={() => setIsContentManagerSectionExpanded(!isContentManagerSectionExpanded)}
                                    className="flex items-center justify-between w-full p-3 text-right"
                                >
                                    <span className="text-sm font-semibold text-orange-800">פעולות של מנהל תוכן</span>
                                    {isContentManagerSectionExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-orange-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-orange-600" />
                                    )}
                                </button>
                                
                                <AnimatePresence>
                                    {isContentManagerSectionExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex gap-3 pb-3 px-3">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setIsEditMode(true);
                                                        setIsContentManagerSectionExpanded(false);
                                                    }} 
                                                    className="flex items-center gap-1 bg-white"
                                                    disabled={book?.status === 'removed_from_catalog'}
                                                >
                                                    <Edit className="h-4 w-4 hidden sm:inline-block" /> עריכת ספר בקטלוג
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    onClick={handleRemoveFromCatalog} 
                                                    disabled={loadingDelete || book?.status === 'removed_from_catalog'}
                                                    className="flex items-center gap-1"
                                                >
                                                    {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 hidden sm:inline-block" />}
                                                    הסר מהקטלוג
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

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
