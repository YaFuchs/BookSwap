
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Book, User, Listing, Basket } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, BookOpen, Search as SearchIcon, RotateCcw, ChevronDown, X, HelpCircle, Filter, BookOpenCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import BookDetailsModal from "../components/catalog/BookDetailsModal";
import { GRADES } from "../components/constants/grades";
import { getBookAvailableCounts } from "@/api/functions";
import { getBasketAvailabilitySummary } from "@/api/functions";
import HintBar from "../components/catalog/HintBar";
import MobileFilterSheet from "../components/common/MobileFilterSheet";
import BookCard from "../components/catalog/BookCard";
import ProfileEditDialog from "../components/user/ProfileEditDialog";
import { useToast } from "@/components/ui/use-toast";
import UnavailableBookAddedDialog from "../components/common/UnavailableBookAddedDialog";

export default function BookCatalogPage({ onGlobalProfileUpdate = async () => {} }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ grade_numbers: [], title_q: "" });
  const [user, setUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [modalAction, setModalAction] = useState('view'); // 'view' is now the only action from this page
  const [availableCounts, setAvailableCounts] = useState({});
  const [userListings, setUserListings] = useState([]);
  const [userBasketBooks, setUserBasketBooks] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [showMyBasketOnly, setShowMyBasketOnly] = useState(false);
  const [showMyBooksOnly, setShowMyBooksOnly] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [basketAvailabilitySummary, setBasketAvailabilitySummary] = useState({ availableBooksCount: 0, uniqueSellersCount: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showProfileNudgeForFirstPublish, setShowProfileNudgeForFirstPublish] = useState(false);
  const [showUnavailableBookDialog, setShowUnavailableBookDialog] = useState(false);
  const refreshTimeoutRef = useRef(null);

  const { toast } = useToast();

  // Function to check if any filters are active
  const hasActiveFilters = React.useCallback(() => {
    return (
      Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0 ||
      filters.title_q && filters.title_q.trim().length > 0 ||
      showMyBooksOnly ||
      showMyBasketOnly);
  }, [filters.grade_numbers, filters.title_q, showMyBooksOnly, showMyBasketOnly]);

  // Dispatch filter status updates
  React.useEffect(() => {
    const isActive = hasActiveFilters();
    document.dispatchEvent(new CustomEvent('filter-status-update', {
      detail: { hasActiveFilters: isActive }
    }));
  }, [hasActiveFilters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await User.me().catch(() => null);
      setUser(currentUser);

      // Fetch ALL books regardless of status to support "My Basket" view with removed books
      const booksData = await Book.list("-created_date");
      setBooks(Array.isArray(booksData) ? booksData : []);

      // Only fetch user-specific data if user is authenticated
      if (currentUser) {
        // Fetch essential user data first
        const [listings, basketItems] = await Promise.all([
        Listing.filter({ seller_id: currentUser.id }),
        Basket.filter({ buyer_id: currentUser.id })
        ]);

        setUserListings(Array.isArray(listings) ? listings : []);
        setUserBasketBooks(Array.isArray(basketItems) ? basketItems : []);

        // Separately fetch counts with error handling to prevent page failure
        try {
          const countsResponse = await getBookAvailableCounts();
          if (countsResponse && countsResponse.data) {
            setAvailableCounts(countsResponse.data);
          }
        } catch (error) {
          console.error("Error fetching book counts (non-critical):", error);
          // Don't show alert for rate limit errors, just log them
          if (!error.message?.includes('Rate limit')) {
            console.warn("Book availability counts temporarily unavailable:", error.message);
          }
          setAvailableCounts({}); // Set empty object so page still works
        }
      } else {
        setAvailableCounts({});
        setUserListings([]);
        setUserBasketBooks([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setBooks([]);
      setAvailableCounts({});
      setUserListings([]);
      setUserBasketBooks([]);
    } finally {
      setLoading(false); // Always set loading to false here
    }
  }, []);

  const fetchBasketSummary = useCallback(async (basketIds) => {
    if (!basketIds || basketIds.length === 0) {
      setBasketAvailabilitySummary({ availableBooksCount: 0, uniqueSellersCount: 0 });
      return;
    }
    setLoadingSummary(true);
    try {
      const response = await getBasketAvailabilitySummary({ basketBookIds: basketIds });
      if (response && response.data) {
        setBasketAvailabilitySummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching basket availability summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (user && userBasketBooks) {
      const basketIds = userBasketBooks.map((item) => item.book_id);
      fetchBasketSummary(basketIds);
    }
  }, [user, userBasketBooks, fetchBasketSummary]);

  const refreshCountsAndListings = useCallback(async () => {
    if (!user) return { listings: [], basketItems: [], counts: {} };

    try {
      // Fetch essential user data first
      const [listings, basketItems] = await Promise.all([
      Listing.filter({ seller_id: user.id }),
      Basket.filter({ buyer_id: user.id })
      ]);

      const safeListings = Array.isArray(listings) ? listings : [];
      const safeBasketItems = Array.isArray(basketItems) ? basketItems : [];

      setUserListings(safeListings);
      setUserBasketBooks(safeBasketItems);

      let counts = {};
      // Separately fetch counts with error handling
      try {
        const countsResponse = await getBookAvailableCounts();
        if (countsResponse && countsResponse.data) {
          counts = countsResponse.data;
          setAvailableCounts(counts);
        }
      } catch (error) {
        console.error("Error refreshing book counts (non-critical):", error);
        // Don't show alert for rate limit errors, just log them
        if (!error.message?.includes('Rate limit')) {
          console.warn("Book availability counts temporarily unavailable:", error.message);
        }
        // Keep existing counts if refresh fails
      }
      return { listings: safeListings, basketItems: safeBasketItems, counts }; // Return fetched data
    } catch (error) {
      console.error("Error refreshing counts and listings:", error);
      // Don't show alert for rate limit errors, just log them
      if (!error.message?.includes('Rate limit')) {
        alert("שגיאה בטעינת הנתונים: " + error.message);
      }
      return { listings: [], basketItems: [], counts: {} }; // Return empty data on error
    }
  }, [user]); // IMPORTANT: 'user' is now correctly in the dependency array

  // Debounced version to prevent too many API calls
  const debouncedRefreshCountsAndListings = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set new timeout
    refreshTimeoutRef.current = setTimeout(() => {
      refreshCountsAndListings();
    }, 500); // Wait 500ms before making the API call
  }, [refreshCountsAndListings]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');

    if (source === 'add_book_success') {
      alert("הספר נוסף בהצלחה לקטלוג!");
      urlParams.delete('source');
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    }

    loadData();

    // Listen for the custom event dispatched from the layout's filter button
    const openSheet = () => setIsMobileFilterOpen(true);
    document.addEventListener('open-mobile-filters', openSheet);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('open-mobile-filters', openSheet);
    };
  }, [loadData]);

  const handleFilterGradeToggle = (gradeId) => {
    setFilters((prev) => ({
      ...prev,
      grade_numbers: Array.isArray(prev.grade_numbers) ?
      prev.grade_numbers.includes(gradeId) ?
      prev.grade_numbers.filter((id) => id !== gradeId) :
      [...prev.grade_numbers, gradeId] :
      [gradeId] // If not an array, initialize with the current gradeId
    }));
  };

  const removeFilterGrade = (gradeId) => {
    setFilters((prev) => ({
      ...prev,
      grade_numbers: Array.isArray(prev.grade_numbers) ?
      prev.grade_numbers.filter((id) => id !== gradeId) :
      [] // If not an array, reset to empty array
    }));
  };

  const resetFilters = () => {
    setFilters({ grade_numbers: [], title_q: "" });
    setShowMyBasketOnly(false); // Reset this filter too
    setShowMyBooksOnly(false); // Reset this filter too
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

  const handleRowClick = (book) => {
    setSelectedBook(book);
    setModalAction('view'); // Set modal to 'view' mode for existing books
    setShowBookModal(true);
  };

  const handleFastPublish = useCallback(async (book) => {
    // Safety check for user and loading state
    if (!user || actionLoading[book.id]) return;

    // Determine if this is the user's first active listing *before* this action
    const isFirstActiveListingBefore = userListings.filter((l) => l.status === 'available').length === 0;

    setActionLoading((prev) => ({ ...prev, [book.id]: true }));
    try {
      // Fetch the full book record to get the recommended_price
      const fullBookRecord = await Book.get(book.id);
      const recommendedPrice = fullBookRecord?.recommended_price || 2000; // Fallback to 2000 if missing

      // Step 1: ALWAYS publish the book with the recommended price
      await Listing.create({
        book_id: book.id,
        seller_id: user.id,
        price_agorot: recommendedPrice, // Use recommended price instead of null
        condition_note: "", // Empty condition
        status: "available",
        city: user.city // Use current city, which might be null
      });

      // Refresh counts and listings data immediately to include the new book
      const { listings: freshListings } = await refreshCountsAndListings();

      // Step 2: AFTER successful publish, check if we need to show the nudge
      // Check if it's their first active listing *after* this action
      const isFirstActiveListingAfter = freshListings.filter((l) => l.status === 'available').length === 1;

      // Determine if the user's profile is incomplete
      const isProfileIncomplete = !user.display_name || user.display_name.trim() === '' ||
      !user.phone_e164 || user.phone_e164.trim() === '' ||
      !user.city || user.city.trim() === '' ||
      user.show_phone === false;

      if (isFirstActiveListingBefore && isFirstActiveListingAfter && isProfileIncomplete) {
        setShowProfileNudgeForFirstPublish(true); // Open the profile nudge dialog
      }

    } catch (error) {
      console.error("Error creating listing:", error);
      alert("שגיאה בפרסום הספר: " + error.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [book.id]: false }));
    }
  }, [user, actionLoading, userListings, refreshCountsAndListings]);

  // New callback for handling publish success from BookDetailsModal
  const handleModalPublishSuccess = useCallback(async () => {
    // Step 1: Ensure local user-specific data is fresh after the book has been published
    const { listings: freshListings } = await refreshCountsAndListings();

    if (!freshListings) return; // Exit if the refresh failed to return data

    // Step 2: Check if a profile nudge is needed with the UPDATED data
    // We check if it's their FIRST active listing *after* the current one was added
    const isFirstActiveListing = freshListings.filter((l) => l.status === 'available').length === 1; // It was 0, now it's 1

    // Check if the user's profile is incomplete
    const isProfileIncomplete = !user?.display_name || user.display_name.trim() === '' ||
    !user?.phone_e164 || user.phone_e164.trim() === '' ||
    !user?.city || user.city.trim() === '' ||
    user?.show_phone === false;

    // If it's their first listing AND their profile is incomplete, show the nudge
    if (isFirstActiveListing && isProfileIncomplete) {
      setShowProfileNudgeForFirstPublish(true);
    }
  }, [refreshCountsAndListings, user]); // userListings is no longer a direct dependency

  const handleFastRemove = async (book) => {
    if (!user || actionLoading[book.id]) return;

    // Find the user's listing for this book
    const userListing = userListings.find((listing) =>
    listing.book_id === book.id && listing.seller_id === user.id
    );

    if (!userListing) return;

    setActionLoading((prev) => ({ ...prev, [book.id]: true }));
    try {
      await Listing.delete(userListing.id);

      // Refresh only the counts and listings data immediately (without debounce)
      await refreshCountsAndListings();
    } catch (error) {
      console.error("Error removing listing:", error);
      alert("שגיאה בהסרת הפרסום: " + error.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [book.id]: false }));
    }
  };

  const handleEditListing = (book) => {
    setSelectedBook(book);
    setModalAction('view'); // Set modal to 'view' mode to show UserListingDetails
    setShowBookModal(true);
  };

  const handleAddToBasket = async (book) => {
    if (!user || actionLoading[`basket-${book.id}`]) return;

    setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: true }));
    try {
      await Basket.create({
        book_id: book.id,
        buyer_id: user.id
      });

      // Refresh basket data and get fresh counts
      const { counts: freshAvailableCounts } = await refreshCountsAndListings();

      // Close modal if it's open
      setShowBookModal(false);

      const currentBookCount = freshAvailableCounts[book.id] || 0;

      if(currentBookCount > 0){
          // Show success toast for available books
          toast({
            title: "נוסף לסל!",
            description: "ראו ביריד מי מוכר אותו",
            className: "bg-green-100 text-green-800 text-right",
            dir: "rtl",
          });
      } else {
          // Show dialog for unavailable books
          setShowUnavailableBookDialog(true);
      }

    } catch (error) {
      console.error("Error adding to basket:", error);
      alert("שגיאה בהוספה לסל: " + error.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: false }));
    }
  };

  const handleRemoveFromBasket = async (book) => {
    if (!user || actionLoading[`basket-${book.id}`]) return;

    // Find the user's basket item for this book
    const basketItem = userBasketBooks.find((item) =>
    item.book_id === book.id && item.buyer_id === user.id
    );

    if (!basketItem) return;

    setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: true }));
    try {
      await Basket.delete(basketItem.id);

      // Refresh basket data immediately (without debounce)
      await refreshCountsAndListings();

      // Close modal if it's open
      setShowBookModal(false);

      // Show success toast
      toast({
        title: "הוסר מהסל",
        description: "הספר הוסר מרשימת הספרים המעניינים אתכם",
        className: "bg-orange-100 text-orange-800 text-right",
        dir: "rtl",
      });

    } catch (error) {
      console.error("Error removing from basket:", error);
      alert("שגיאה בהסרה מהסל: " + error.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`basket-${book.id}`]: false }));
    }
  };

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
  const showMyBooksEmptyState = showMyBooksOnly && userListings.length === 0;
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
                  <Input placeholder="חפשו שם ספר..." value={filters.title_q} onChange={(e) => setFilters((p) => ({ ...p, title_q: e.target.value }))} className="pr-10 w-full" />
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
            showMyBasketOnly={showMyBasketOnly} // Added this prop
          />
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <TooltipProvider>
            {/* Desktop Table View - hidden on mobile */}
            <Card className="shadow-lg hidden md:block">
              <CardHeader><CardTitle className="text-2xl text-lg font-semibold leading-none tracking-tight">תוצאות ({filteredBooks.length} ספרים בקטלוג)</CardTitle></CardHeader>
              <CardContent className="p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-20 px-3 py-2">תמונה</TableHead>
                      <TableHead className="text-right px-3 py-2">פרטי הספר</TableHead>
                      <TableHead className="text-right px-3 py-2">זמינים ביריד</TableHead>
                      <TableHead className="text-right px-3 py-2">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.length > 0 ? filteredBooks.map((book) => {
                      const count = availableCounts[book.id] || 0;
                      const bookListed = isBookListed(book.id);
                      const bookInBasket = isBookInBasket(book.id);
                      const isActionLoading = actionLoading[book.id]; // For listing actions
                      const isBasketActionLoading = actionLoading[`basket-${book.id}`]; // For basket actions

                      return (
                        <TableRow
                          key={book.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            // Don't trigger row click if clicking on the action button or tooltip trigger
                            if (e.target.closest('button, [data-radix-tooltip-trigger]')) return;
                            handleRowClick(book);
                          }}>

                          <TableCell className="w-20 px-3 py-2 align-middle">
                            <div className="flex justify-center">
                              {book.cover_image_url ?
                              <img
                                src={book.cover_image_url}
                                alt={book.title_he}
                                className="w-16 h-20 object-cover rounded flex-shrink-0" /> :
                              <div
                                className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-8 h-8 text-gray-400" />
                                </div>
                              }
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-4 align-top">
                            <div>
                              <div className="text-lg font-bold text-gray-900">{book.title_he}</div>
                              {book.subject && <div className="text-sm text-gray-600 mt-1">{book.subject}</div>}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Array.isArray(book.grade_numbers) && book.grade_numbers.slice(0, 5).map((gradeNum) => {
                                  const grade = GRADES.find((g) => g.id === gradeNum);
                                  return grade ? <Badge key={gradeNum} variant="secondary" className="text-xs whitespace-nowrap">{grade.name}</Badge> : null;
                                })}
                                {Array.isArray(book.grade_numbers) && book.grade_numbers.length > 5 && <span className="text-xs text-gray-500">...</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-4 align-middle text-right">
                            {count > 0 ?
                            <Badge className="bg-green-100 text-green-800 text-sm flex items-center gap-1.5 max-w-[65px] justify-center">
                                <BookOpenCheck className="w-4 h-4" />
                                <span className="truncate">{count}</span>
                              </Badge> :
                            <span className="text-sm text-gray-500">אין במלאי</span>
                            }
                          </TableCell>
                          <TableCell className="px-3 py-4 align-middle text-center">
                            {user ?
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                {/* Listing Actions */}
                                {bookListed ?
                              <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditListing(book);
                                    }}
                                    disabled={isActionLoading}
                                    className="bg-green-600 hover:bg-green-700 text-xs min-w-[82px]">
                                        {isActionLoading ?
                                    <Loader2 className="w-3 h-3 animate-spin" /> :
                                    "ערוך פרסום"
                                    }
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-right">ניתן לערוך את פרטי המודעה</p>
                                    </TooltipContent>
                                  </Tooltip> :
                              <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFastPublish(book);
                                    }}
                                    disabled={isActionLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs min-w-[82px]">
                                        {isActionLoading ?
                                    <Loader2 className="w-3 h-3 animate-spin" /> :
                                    "פרסם ביריד"
                                    }
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-right">אם הספר הזה נמצא ברשותך, ניתן לפרסם אותו ביריד הספרים ולהציע אותו למכירה לאחרים. </p>
                                    </TooltipContent>
                                  </Tooltip>
                              }

                                {/* Basket Actions */}
                                {bookInBasket ?
                              <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromBasket(book);
                                    }}
                                    disabled={isBasketActionLoading}
                                    className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 min-w-[82px]">
                                        {isBasketActionLoading ?
                                    <Loader2 className="w-3 h-3 animate-spin" /> :
                                    "הסר מהסל"
                                    }
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-right">הסר ספר זה מרשימת הספרים שאני מעוניין לקנות</p>
                                    </TooltipContent>
                                  </Tooltip> :
                              <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToBasket(book);
                                    }}
                                    disabled={isBasketActionLoading}
                                    className="text-xs border-green-300 text-green-600 hover:bg-green-50 min-w-[82px]">
                                        {isBasketActionLoading ?
                                    <Loader2 className="w-3 h-3 animate-spin" /> :
                                    "הוסף לסל"
                                    }
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-right">הוספת ספר זה לרשימת הספרים המעניינים אותי</p>
                                    </TooltipContent>
                                  </Tooltip>
                              }
                              </div> :
                            <span className="text-xs text-gray-400">התחבר לפעולות</span>
                            }
                          </TableCell>
                        </TableRow>);
                    }) :
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 px-3 py-2">
                          {showMyBasketEmptyState ?
                        <div className="flex flex-col items-center gap-2">
                              <span>הסל שלכם ריק, הוסיפו לסל ספרים שאתם מעוניינים להשיג</span>
                            </div> :
                        showMyBooksEmptyState ?
                        <div className="flex flex-col items-center gap-2">
                                <h3 className="text-xl font-semibold text-gray-700">לא פרסמת ספרים למכירה</h3>
                                <p className="text-gray-500">פרסמו ספרים מהקטלוג כדי שיופיעו כאן</p>
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                  עיון בקטלוג
                                </Button>
                              </div> :
                        showEmptyCatalogState ?
                        "אין ספרים בקטלוג." :
                        showNoResultsState ?
                        <div className="flex flex-col items-center gap-2">
                                    <span>לא נמצאו ספרים</span>
                                    <Button variant="outline" size="sm" onClick={resetFilters}>
                                      איפוס החיפוש
                                    </Button>
                                  </div> :
                        "אין ספרים בקטלוג."
                        }
                        </TableCell>
                      </TableRow>
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Card View - visible only on mobile */}
            <div className="block md:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">תוצאות ({filteredBooks.length} ספרים בקטלוג)</h2>
                {hasActiveFilters() &&
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  size="sm">

                    <RotateCcw className="w-4 h-4" />
                    נקה סינון
                  </Button>
                }
              </div>
              {filteredBooks.length > 0 ?
              <div className="space-y-4">
                  {filteredBooks.map((book) =>
                <BookCard
                  key={book.id}
                  book={book}
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
                  onRemoveFromBasket={handleRemoveFromBasket} />
                )}
                </div> :
              <Card className="shadow-sm">
                  <CardContent className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    {showMyBasketEmptyState ?
                  <>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">הסל שלכם ריק</h3>
                        <p className="text-gray-500">הוסיפו לסל ספרים שאתם מעוניינים להשיג</p>
                      </> :
                  showMyBooksEmptyState ?
                  <>
                          <h3 className="text-xl font-semibold text-gray-700">לא פרסמת ספרים למכירה</h3>
                          <p className="text-gray-500">פרסמו ספרים מהקטלוג כדי שיופיעו כאן</p>
                          <Button variant="outline" onClick={resetFilters} className="mt-4">
                             עיון בקטלוג
                          </Button>
                        </> :
                  showEmptyCatalogState ?
                  <p className="text-gray-500">אין ספרים בקטלוג.</p> :
                  showNoResultsState ?
                  <>
                              <h3 className="text-xl font-semibold text-gray-700 mb-2">לא נמצאו ספרים</h3>
                              <p className="text-gray-500">נסו לשנות את הסינונים או לחפש משהו אחר</p>
                              <Button variant="outline" onClick={resetFilters} className="mt-4">איפוס החיפוש</Button>
                            </> :
                  // Default fallback if logic is missed
                  <p className="text-gray-500">אין ספרים בקטלוג.</p>
                  }
                  </CardContent>
                </Card>
              }
            </div>
          </TooltipProvider>
        </div>

        <BookDetailsModal
          book={selectedBook}
          open={showBookModal}
          onOpenChange={setShowBookModal}
          GRADES={GRADES}
          user={user}
          onBookDeleted={() => {
            setShowBookModal(false);
            loadData();
          }}
          modalAction={modalAction}
          onBookPublished={handleModalPublishSuccess} // Changed to new handler
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
    </>);
}
