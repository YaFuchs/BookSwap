import { useState, useCallback } from "react";

// Helper function to safely check if a string is effectively empty (null, undefined, or just whitespace)
const isStringEffectivelyEmpty = (str) => !str || String(str).trim() === '';

export function useBookModals(currentUser) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [modalAction, setModalAction] = useState('view');
  const [showProfileNudgeForFirstPublish, setShowProfileNudgeForFirstPublish] = useState(false);
  const [showUnavailableBookDialog, setShowUnavailableBookDialog] = useState(false);

  const handleRowClick = useCallback((book) => {
    setSelectedBook(book);
    setModalAction('view'); // Set modal to 'view' mode for existing books
    setShowBookModal(true);
  }, []);

  // New callback for handling publish success from BookDetailsModal
  const handleModalPublishSuccess = useCallback(async (refreshCountsAndListings) => {
    // Step 1: Ensure local user-specific data is fresh after the book has been published
    const { listings: freshListings } = await refreshCountsAndListings();

    if (!freshListings) return; // Exit if the refresh failed to return data

    // Step 2: Check if a profile nudge is needed with the UPDATED data
    // We check if it's their FIRST active listing *after* the current one was added
    const isFirstActiveListing = freshListings.filter((l) => l.status === 'available').length === 1;

    // Check if the user's profile is incomplete - now correctly evaluated as a boolean
    // Using the new helper function for robustness
    const isProfileIncomplete = isStringEffectivelyEmpty(currentUser?.display_name) ||
      isStringEffectivelyEmpty(currentUser?.phone_e164) ||
      isStringEffectivelyEmpty(currentUser?.city) ||
      currentUser?.show_phone === false;

    // If it's their first listing AND their profile is incomplete, show the nudge
    if (isFirstActiveListing && isProfileIncomplete) {
      setShowProfileNudgeForFirstPublish(true);
    }
  }, [currentUser]);

  return {
    selectedBook,
    setSelectedBook,
    showBookModal,
    setShowBookModal,
    modalAction,
    setModalAction,
    showProfileNudgeForFirstPublish,
    setShowProfileNudgeForFirstPublish,
    showUnavailableBookDialog,
    setShowUnavailableBookDialog,
    handleRowClick,
    handleModalPublishSuccess
  };
}