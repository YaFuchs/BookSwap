
import { useState, useCallback } from "react";
import { Book, Listing, Basket } from "@/api/entities";

// Helper function to safely check if a string is effectively empty (null, undefined, or just whitespace)
const isStringEffectivelyEmpty = (str) => !str || String(str).trim() === '';

export function useBookActions(user, userListings, refreshCountsAndListings, notify) {
  const [actionLoading, setActionLoading] = useState({});
  const lastActionTimeRef = useState({})[0]; // Track last action time per action type

  // Add throttling for actions to prevent rapid successive API calls
  const THROTTLE_DELAY = 1000; // 1 second between actions

  const handleFastPublish = useCallback(async (book) => {
    // Safety check for user and loading state
    if (!user || actionLoading[book.id]) return;

    // Throttle rapid successive actions
    const now = Date.now();
    const lastTime = lastActionTimeRef[`publish-${book.id}`] || 0;
    if (now - lastTime < THROTTLE_DELAY) {
      console.log("Throttling fast publish to prevent rate limits");
      return;
    }
    lastActionTimeRef[`publish-${book.id}`] = now;

    // Determine if this is the user's first active listing *before* this action
    const isFirstActiveListingBefore = userListings.filter((l) => l.status === 'available').length === 0;

    setActionLoading((prev) => ({ ...prev, [book.id]: true }));
    try {
      // Fetch the full book record to get the recommended_price
      const fullBookRecord = await Book.get(book.id);
      const recommendedPrice = fullBookRecord?.recommended_price ?? 2000; // Use nullish coalescing to support 0 as a valid recommended price

      // Step 1: ALWAYS publish the book with the recommended price
      await Listing.create({
        book_id: book.id,
        seller_id: user.id,
        price_agorot: recommendedPrice, // Use recommended price
        condition_note: "", // Empty condition
        status: "available",
        city: user.city // Use current city, which might be null
      });

      // Add the success notification here
      notify.success("הספר פורסם!", "הספר נוסף למכירה ביריד בהצלחה.");

      // Step 2: Refresh data and keep loading state until refresh completes
      const { listings: freshListings } = await refreshCountsAndListings();

      // Step 3: Check if profile nudge should be shown AFTER successful publish
      const isFirstActiveListingAfter = freshListings && freshListings.filter((l) => l.status === 'available').length === 1;

      // Determine if the user's profile is incomplete using the helper
      const isProfileIncomplete = isStringEffectivelyEmpty(user?.display_name) ||
        isStringEffectivelyEmpty(user?.phone_e164) ||
        isStringEffectivelyEmpty(user?.city) ||
        user?.show_phone === false;

      // Return signal for profile nudge if needed
      if (isFirstActiveListingBefore && isFirstActiveListingAfter && isProfileIncomplete) {
        return { shouldShowProfileNudge: true };
      }

    } catch (error) {
      console.error("Error creating listing:", error);
      // Only show notification for non-rate limit errors
      if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
        notify.error("שגיאה בפרסום הספר", error.message);
      }
    } finally {
      // Only clear loading state after all operations complete
      setActionLoading((prev) => ({ ...prev, [book.id]: false }));
    }
  }, [user, actionLoading, userListings, refreshCountsAndListings, notify, lastActionTimeRef]);

  const handleEditListing = useCallback((book, setSelectedBook, setModalAction, setShowBookModal) => {
    setSelectedBook(book);
    setModalAction('view'); // Set modal to 'view' mode to show UserListingDetails
    setShowBookModal(true);
  }, []);

  const handleAddToBasket = useCallback(async (book, setShowBookModal, availableCounts, setShowUnavailableBookDialog) => {
    if (!user || actionLoading[`basket-${book.id}`]) return;

    // Throttle rapid successive basket actions
    const now = Date.now();
    const lastTime = lastActionTimeRef[`basket-add-${book.id}`] || 0;
    if (now - lastTime < THROTTLE_DELAY) {
      console.log("Throttling add to basket to prevent rate limits");
      return;
    }
    lastActionTimeRef[`basket-add-${book.id}`] = now;

    setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: true }));
    try {
      await Basket.create({
        book_id: book.id,
        buyer_id: user.id
      });

      // Refresh basket data and get fresh counts - keep loading until complete
      const { counts: freshAvailableCounts } = await refreshCountsAndListings();

      // Close modal if it's open
      if (setShowBookModal) {
        setShowBookModal(false);
      }

      const currentBookCount = freshAvailableCounts ? freshAvailableCounts[book.id] || 0 : 0;

      if(currentBookCount > 0){
          // Show success toast for available books
          notify.success("נוסף לסל!", "ראו ביריד מי מוכר אותו");
      } else {
          // Show dialog for unavailable books
          if (setShowUnavailableBookDialog) {
            setShowUnavailableBookDialog(true);
          }
      }

    } catch (error) {
      console.error("Error adding to basket:", error);
      // Only show notification for non-rate limit errors
      if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
        notify.error("שגיאה בהוספה לסל", error.message);
      }
    } finally {
      // Only clear loading state after all operations complete
      setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: false }));
    }
  }, [user, actionLoading, refreshCountsAndListings, notify, lastActionTimeRef]);

  const handleRemoveFromBasket = useCallback(async (book, userBasketBooks, setShowBookModal) => {
    if (!user || actionLoading[`basket-${book.id}`]) return;

    // Throttle rapid successive basket actions
    const now = Date.now();
    const lastTime = lastActionTimeRef[`basket-remove-${book.id}`] || 0;
    if (now - lastTime < THROTTLE_DELAY) {
      console.log("Throttling remove from basket to prevent rate limits");
      return;
    }
    lastActionTimeRef[`basket-remove-${book.id}`] = now;

    // Find the user's basket item for this book
    const basketItem = userBasketBooks.find((item) =>
      item.book_id === book.id && item.buyer_id === user.id
    );

    if (!basketItem) return;

    setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: true }));
    try {
      await Basket.delete(basketItem.id);

      // Refresh basket data - keep loading until complete
      await refreshCountsAndListings();

      // Close modal if it's open
      if (setShowBookModal) {
        setShowBookModal(false);
      }

      // Show success toast
      notify.success("הוסר מהסל", "הספר הוסר מרשימת הספרים המעניינים אתכם");

    } catch (error) {
      console.error("Error removing from basket:", error);
      // Only show notification for non-rate limit errors
      if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
        notify.error("שגיאה בהסרה מהסל", error.message);
      }
    } finally {
      // Only clear loading state after all operations complete
      setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: false }));
    }
  }, [user, actionLoading, refreshCountsAndListings, notify, lastActionTimeRef]);

  return {
    actionLoading,
    handleFastPublish,
    handleEditListing,
    handleAddToBasket,
    handleRemoveFromBasket
  };
}
