
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Book, User, Listing, Basket } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, BookOpen, Search as SearchIcon, RotateCcw, ChevronDown, X, HelpCircle, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import BookDetailsModal from "../components/catalog/BookDetailsModal";
import { GRADES } from "../components/constants/grades";
import HintBar from "../components/catalog/HintBar";
import MobileFilterSheet from "../components/common/MobileFilterSheet";
import BookCard from "../components/catalog/BookCard";
import ProfileEditDialog from "../components/user/ProfileEditDialog";
import UnavailableBookAddedDialog from "../components/common/UnavailableBookAddedDialog";
import useAppStore from "../components/stores/useAppStore";
import ActiveMobileFilters from "../components/common/ActiveMobileFilters";
import BookCatalogDesktopTable from "../components/catalog/BookCatalogDesktopTable";
import BookCatalogMobileCards from "../components/catalog/BookCatalogMobileCards";
import { useBookCatalogData } from "../components/hooks/useBookCatalogData";
import { useBookModals } from "../components/hooks/useBookModals";
import { useBookActions } from "../components/hooks/useBookActions";
import { useAppNotifications } from "../components/hooks/useAppNotifications";

export default function BookCatalogPage({ onGlobalProfileUpdate = async () => {}, setPageMobileFilterOpener }) {
  const {
    filters,
    setFilters,
    showMyBasketOnly,
    setShowMyBasketOnly,
    showMyBooksOnly,
    setShowMyBooksOnly,
    resetFilters: globalResetFilters,
    setTitleQDebounced,
  } = useAppStore();
  
  const [user, setUser] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const notify = useAppNotifications();

  // Use the custom hook for data management - now passing notify
  const { 
    books, 
    loading, 
    userListings, 
    userBasketBooks, 
    availableCounts, 
    loadingSummary, 
    basketAvailabilitySummary,
    refreshCountsAndListings, 
    debouncedRefreshCountsAndListings,
    loadData,
    refreshDataWithoutLoading,
    updateBookInList, // Get the new function
    removeBookFromList, // Get the new function
  } = useBookCatalogData(user, notify);

  // Use the custom hook for modal management - now passing user
  const {
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
  } = useBookModals(user);

  // Use the custom hook for book actions
  const {
    actionLoading,
    handleFastPublish: baseFastPublish,
    handleEditListing: baseEditListing,
    handleAddToBasket: baseAddToBasket,
    handleRemoveFromBasket: baseRemoveFromBasket
  } = useBookActions(user, userListings, refreshCountsAndListings, notify);

  // Enhanced wrapper function to handle profile nudge logic
  const handleFastPublish = useCallback(async (book) => {
    const result = await baseFastPublish(book);
    // Handle profile nudge if needed - this works for all publish actions
    if (result?.shouldShowProfileNudge) {
      setShowProfileNudgeForFirstPublish(true);
    }
  }, [baseFastPublish, setShowProfileNudgeForFirstPublish]);

  const handleEditListing = useCallback((book) => {
    baseEditListing(book, setSelectedBook, setModalAction, setShowBookModal);
  }, [baseEditListing, setSelectedBook, setModalAction, setShowBookModal]);

  const handleAddToBasket = useCallback(async (book) => {
    await baseAddToBasket(book, setShowBookModal, availableCounts, setShowUnavailableBookDialog);
  }, [baseAddToBasket, setShowBookModal, availableCounts, setShowUnavailableBookDialog]);

  const handleRemoveFromBasket = useCallback(async (book) => {
    await baseRemoveFromBasket(book, userBasketBooks, setShowBookModal);
  }, [baseRemoveFromBasket, userBasketBooks, setShowBookModal]);

  // Function to check if any filters are active
  const hasActiveFilters = React.useCallback(() => {
    return (
      Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0 ||
      filters.title_q && filters.title_q.trim().length > 0 ||
      showMyBooksOnly ||
      showMyBasketOnly);
  }, [filters.grade_numbers, filters.title_q, showMyBooksOnly, showMyBasketOnly]);

  // Initial user load effect - only run once
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (setPageMobileFilterOpener) {
        setPageMobileFilterOpener(() => () => setIsMobileFilterOpen(true));
        // Cleanup function to unregister when component unmounts
        return () => setPageMobileFilterOpener(null);
    }
  }, [setPageMobileFilterOpener, setIsMobileFilterOpen]);

  // Handle URL parameters effect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');

    if (source === 'add_book_success') {
      notify.success("הספר נוסף בהצלחה!", "הספר נוסף לקטלוג בהצלחה.");
      urlParams.delete('source');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [notify]);

  const handleFilterGradeToggle = (gradeId) => {
    setFilters({
      ...filters,
      grade_numbers: Array.isArray(filters.grade_numbers) ?
      filters.grade_numbers.includes(gradeId) ?
      filters.grade_numbers.filter((id) => id !== gradeId) :
      [...filters.grade_numbers, gradeId] :
      [gradeId] // If not an array, initialize with the current gradeId
    });
  };

  const removeFilterGrade = (gradeId) => {
    setFilters({
      ...filters,
      grade_numbers: Array.isArray(filters.grade_numbers) ?
      filters.grade_numbers.filter((id) => id !== gradeId) :
      [] // If not an array, reset to empty array
    });
  };

  const resetFilters = () => {
    globalResetFilters();
  };

  const handleMyBasketToggle = () => {
    const nextState = !showMyBasketOnly;
    setShowMyBasketOnly(nextState);
    if (nextState) {
      setShowMyBooksOnly(false);
    }
  };

  const handleMyBooksToggle = () => {
    const nextState = !showMyBooksOnly;
    setShowMyBooksOnly(nextState);
    if (nextState) {
      setShowMyBasketOnly(false);
    }
  };

  // New callback for handling publish success from BookDetailsModal
  const handleModalPublishSuccessWrapper = useCallback(async () => {
    await handleModalPublishSuccess(refreshCountsAndListings);
  }, [handleModalPublishSuccess, refreshCountsAndListings]);

  // New generic handler for any data change in BookDetailsModal that requires a refresh
  const handleBookCatalogDataChange = useCallback(() => {
    refreshDataWithoutLoading(); // Use the lightweight refresh instead of loadData
  }, [refreshDataWithoutLoading]);

  // --- New Granular Update Handlers ---
  const handleBookUpdated = useCallback((updatedBook) => {
    updateBookInList(updatedBook);
    setShowBookModal(false); // Close the modal on success
  }, [updateBookInList, setShowBookModal]);

  const handleBookDeleted = useCallback((bookId) => {
    removeBookFromList(bookId);
    setShowBookModal(false); // Close the modal on success
  }, [removeBookFromList, setShowBookModal]);

  const isBookListed = useCallback((bookId) => {
    // A book is considered listed only if there is an 'available' listing for it.
    return userListings.some((listing) =>
    listing.book_id === bookId && listing.seller_id === user?.id && listing.status === 'available'
    );
  }, [userListings, user]);

  const isBookInBasket = useCallback((bookId) => {
    return userBasketBooks.some((item) =>
    item.book_id === bookId && item.buyer_id === user?.id
    );
  }, [userBasketBooks, user]);

  // Memoize the set of book IDs in the user's basket for efficient lookup
  const userBasketBookIds = React.useMemo(() =>
  new Set(userBasketBooks.map((item) => item.book_id)),
  [userBasketBooks]
  );

  // Memoize the set of book IDs for user's listings
  const myListedBookIds = React.useMemo(() =>
  new Set(userListings.map((item) => item.book_id)),
  [userListings]
  );

  const filteredBooks = React.useMemo(() => {
    return books
      .filter((book) => {
        // Status filter: only show active books UNLESS we're in "My Basket" or "My Books" mode
        const statusMatch = showMyBasketOnly || showMyBooksOnly || book.status === 'active';

        const titleMatch = !filters.title_q || book.title_he.toLowerCase().includes(filters.title_q.toLowerCase());
        const gradeMatch = !Array.isArray(filters.grade_numbers) || filters.grade_numbers.length === 0 ||
          (Array.isArray(book.grade_numbers) && book.grade_numbers.some((grade) => filters.grade_numbers.includes(grade)));
        const basketMatch = !showMyBasketOnly || userBasketBookIds.has(book.id);
        const myBooksMatch = !showMyBooksOnly || isBookListed(book.id);

        return statusMatch && titleMatch && gradeMatch && basketMatch && myBooksMatch;
      })
      .sort((a, b) => {
        const countA = availableCounts[a.id] || 0;
        const countB = availableCounts[b.id] || 0;

        // Primary sort: by availability count, descending
        if (countA !== countB) {
          return countB - countA;
        }

        // Secondary sort: by title, alphabetically, for stability
        return a.title_he.localeCompare(b.title_he);
      });
  }, [books, filters, showMyBasketOnly, showMyBooksOnly, userBasketBookIds, isBookListed, availableCounts]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  // Determine empty state type
  const hasFiltersApplied = hasActiveFilters();
  const showNoResultsState = books.length > 0 && filteredBooks.length === 0 && hasFiltersApplied;
  const showEmptyCatalogState = books.length === 0;
  const showMyBooksEmptyState = showMyBooksOnly && userListings.filter((l) => l.status === 'available').length === 0;
  const showMyBasketEmptyState = showMyBasketOnly && userBasketBooks.length === 0;

  const isSelectedBookInBasket = selectedBook ? isBookInBasket(selectedBook.id) : false;
  const isBasketActionLoadingForSelectedBook = selectedBook ? actionLoading[`basket-${selectedBook.id}`] : false;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          {/* Desktop Header and Filters - completely hidden on mobile */}
          <div className="hidden md:block">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-4">
              <div className="flex justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">קטלוג הספרים</h1>
              </div>
              <div className="flex items-center gap-4 flex-wrap mt-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">שכבת לימוד<ChevronDown className="w-4 h-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium text-right">בחירת שכבות לימוד</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADES.map((grade) =>
                        <div key={grade.id} className="flex items-center gap-2 flex-row-reverse">
                            <Checkbox id={`filter-grade-${grade.id}`} checked={filters.grade_numbers.includes(grade.id)} onCheckedChange={() => handleFilterGradeToggle(grade.id)} />
                            <label htmlFor={`filter-grade-${grade.id}`} className="text-sm cursor-pointer">{grade.name.replace('כיתה ', '')}</label>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Grade Badges */}
                {Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0 &&
                <div className="flex flex-wrap gap-2">
                    {filters.grade_numbers.map((gradeId) => {
                    const grade = GRADES.find((g) => g.id === gradeId);
                    return grade ? <Badge key={gradeId} variant="secondary" className="flex items-center gap-1">{grade.name.replace('כיתה ', '')}<X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeFilterGrade(gradeId)} /></Badge> : null;
                  })}
                  </div>
                }
                <div className="relative w-full md:max-w-xs">
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="חפשו שם ספר..." 
                    value={filters.title_q} 
                    onChange={(e) => setTitleQDebounced(e.target.value)}
                    className="pr-10 w-full" 
                  />
                </div>
                {user &&
                <div className="flex items-center gap-2">
                    <Button
                    onClick={handleMyBooksToggle}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${showMyBooksOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }>
                      ספרים שפירסמתי ({userListings.filter((l) => l.status === 'available').length})
                    </Button>
                    <Button
                    onClick={handleMyBasketToggle}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${showMyBasketOnly ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }>
                      הסל שלי ({userBasketBooks.length})
                    </Button>
                  </div>
                }
                {hasActiveFilters() && <Button variant="ghost" onClick={resetFilters} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"><RotateCcw className="w-4 h-4" /> נקה סינון</Button>}
              </div>
            </div>
          </div>
          {/* HintBar - moved inside the sticky container */}
          <HintBar
            user={user}
            pageType="catalog"
            userListingsCount={userListings.filter((l) => l.status === 'available').length}
            userBasketCount={userBasketBooks.length}
            basketAvailabilitySummary={basketAvailabilitySummary}
            loadingSummary={loadingSummary}
            showMyBasketOnly={showMyBasketOnly}
          />
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <BookCatalogDesktopTable
            filteredBooks={filteredBooks}
            availableCounts={availableCounts}
            user={user}
            isBookListed={isBookListed}
            isBookInBasket={isBookInBasket}
            actionLoading={actionLoading}
            handleRowClick={handleRowClick}
            handleFastPublish={handleFastPublish}
            handleEditListing={handleEditListing}
            handleAddToBasket={handleAddToBasket}
            handleRemoveFromBasket={handleRemoveFromBasket}
            showMyBasketEmptyState={showMyBasketEmptyState}
            showMyBooksEmptyState={showMyBooksEmptyState}
            showEmptyCatalogState={showEmptyCatalogState}
            showNoResultsState={showNoResultsState}
            resetFilters={resetFilters}
            GRADES={GRADES}
          />

          {/* Mobile Card View - visible only on mobile */}
          <div className="block md:hidden">
            <ActiveMobileFilters
              filters={filters}
              showMyBasketOnly={showMyBasketOnly}
              showMyBooksOnly={showMyBooksOnly}
              resetFilters={resetFilters}
              GRADES={GRADES}
              hasActiveFilters={hasActiveFilters()}
            />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">תוצאות ({filteredBooks.length} ספרים בקטלוג)</h2>
            </div>
            <BookCatalogMobileCards
              filteredBooks={filteredBooks}
              GRADES={GRADES}
              user={user}
              availableCounts={availableCounts}
              isBookListed={isBookListed}
              isBookInBasket={isBookInBasket}
              actionLoading={actionLoading}
              onRowClick={handleRowClick}
              onFastPublish={handleFastPublish}
              onEditListing={handleEditListing}
              onAddToBasket={handleAddToBasket}
              onRemoveFromBasket={handleRemoveFromBasket}
              showMyBasketEmptyState={showMyBasketEmptyState}
              showMyBooksEmptyState={showMyBooksEmptyState}
              showEmptyCatalogState={showEmptyCatalogState}
              showNoResultsState={showNoResultsState}
              resetFilters={resetFilters}
            />
          </div>
        </div>

        <BookDetailsModal
          book={selectedBook}
          open={showBookModal}
          onOpenChange={setShowBookModal}
          GRADES={GRADES}
          user={user}
          onBookDeleted={handleBookDeleted} // Use the new granular handler
          onBookUpdated={handleBookUpdated} // Pass the new granular handler
          modalAction={modalAction}
          onBookPublished={handleModalPublishSuccessWrapper}
          onBookCatalogDataChange={handleBookCatalogDataChange}
          availableCounts={availableCounts}
          isBookInBasket={isSelectedBookInBasket}
          basketActionLoading={isBasketActionLoadingForSelectedBook}
          onAddToBasket={() => selectedBook && handleAddToBasket(selectedBook)}
          onRemoveFromBasket={() => selectedBook && handleRemoveFromBasket(selectedBook)} />


        {/* Profile Nudge Dialog for First Fast Publish */}
        <ProfileEditDialog
          open={showProfileNudgeForFirstPublish}
          onOpenChange={setShowProfileNudgeForFirstPublish}
          currentUser={user}
          onProfileUpdated={async () => {
            // Close the nudge dialog
            setShowProfileNudgeForFirstPublish(false);

            // Fetch the fresh user data to update the local state.
            const freshUser = await User.me();
            setUser(freshUser);

            // Trigger the global user refresh in the Layout via the prop to remove the red dot.
            await onGlobalProfileUpdate();
          }} />

        {/* Unavailable Book Added Dialog */}
        <UnavailableBookAddedDialog
            open={showUnavailableBookDialog}
            onOpenChange={setShowUnavailableBookDialog}
        />

      </div>

      <MobileFilterSheet
        open={isMobileFilterOpen}
        onOpenChange={setIsMobileFilterOpen}
        filters={filters}
        setFilters={setFilters}
        handleFilterGradeToggle={handleFilterGradeToggle}
        removeFilterGrade={removeFilterGrade}
        showMyBooksOnly={showMyBooksOnly}
        handleMyBooksToggle={handleMyBooksToggle}
        userListingsCount={userListings.filter((l) => l.status === 'available').length}
        showMyBasketOnly={showMyBasketOnly}
        handleMyBasketToggle={handleMyBasketToggle}
        userBasketCount={userBasketBooks.length}
        resetFilters={resetFilters}
        user={user}
        GRADES={GRADES}
        hasActiveFilters={hasActiveFilters()} />
    </>
  );
}
