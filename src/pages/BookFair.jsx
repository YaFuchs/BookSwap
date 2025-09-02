
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, RotateCcw, BookOpen, Loader2, ChevronDown, X, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import SellerGroupList from "../components/search/SellerGroupList";
import { BookSearch } from "../components/integrations/BookSearch";
import { GRADES } from "../components/constants/grades";
import { User, Basket, Listing } from "@/api/entities";
import { createPageUrl } from "@/utils";
import ProfileEditDialog from "../components/user/ProfileEditDialog";
import MobileFilterSheet from "../components/common/MobileFilterSheet";
import { getBasketAvailabilitySummary } from "@/api/functions";
import HintBar from "../components/catalog/HintBar";

export default function BookFairPage() {
  const [groupedResults, setGroupedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ grade_numbers: [], title_q: "" });
  const [debouncedTitle, setDebouncedTitle] = useState(filters.title_q);
  const [user, setUser] = useState(null);
  const [showMyBooksOnly, setShowMyBooksOnly] = useState(false);
  const [showMyBasketOnly, setShowMyBasketOnly] = useState(false);
  const [myBasketBookIds, setMyBasketBookIds] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [showProfileCompletionDialog, setShowProfileCompletionDialog] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);

  // New state variables for basket availability summary
  const [basketAvailabilitySummary, setBasketAvailabilitySummary] = useState({ availableBooksCount: 0, uniqueSellersCount: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [hasAutoAppliedBasketFilter, setHasAutoAppliedBasketFilter] = useState(false);

  // Function to check if any filters are active
  const hasActiveFilters = React.useCallback(() => {
    return (
      Array.isArray(filters.grade_numbers) && filters.grade_numbers.length > 0 ||
      debouncedTitle && debouncedTitle.trim().length > 0 ||
      showMyBooksOnly ||
      showMyBasketOnly);

  }, [filters.grade_numbers, debouncedTitle, showMyBooksOnly, showMyBasketOnly]);

  // Dispatch filter status updates
  React.useEffect(() => {
    const isActive = hasActiveFilters();
    document.dispatchEvent(new CustomEvent('filter-status-update', {
      detail: { hasActiveFilters: isActive }
    }));
  }, [hasActiveFilters]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedTitle(filters.title_q);
    }, 300);
    return () => clearTimeout(timerId);
  }, [filters.title_q]);

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
        setBasketAvailabilitySummary({ availableBooksCount: 0, uniqueSellersCount: 0 });
    } finally {
        setLoadingSummary(false);
    }
  }, []);

  // useEffect for initial user data and event listener setup
  useEffect(() => {
    const loadUserOnly = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
        // Clear user-specific data if user fetch fails
        setMyListings([]);
        setMyBasketBookIds([]);
      }
    };
    loadUserOnly();

    // Listen for the custom event dispatched from the layout's filter button
    const openSheet = () => setIsMobileFilterOpen(true);
    document.addEventListener('open-mobile-filters', openSheet);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('open-mobile-filters', openSheet);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Add event listener for My Basket activation
  useEffect(() => {
    const handleMyBasketActivation = () => {
      setShowMyBasketOnly(true);
    };

    document.addEventListener('activate-my-basket-filter', handleMyBasketActivation);

    return () => {
      document.removeEventListener('activate-my-basket-filter', handleMyBasketActivation);
    };
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedMyListings = [];
      let fetchedMyBasketBookIds = [];

      // Always re-fetch current user's listings and basket data
      // This ensures the counts on the filter buttons are up-to-date
      // whenever a search operation (initial load, filter change, refresh) occurs.
      if (user?.id) { // Ensure user and user.id exist before trying to fetch user-specific data
        try {
          const [listingsData, basketData] = await Promise.all([
            Listing.filter({ seller_id: user.id }),
            Basket.filter({ buyer_id: user.id })
          ]);
          fetchedMyListings = Array.isArray(listingsData) ? listingsData : [];
          fetchedMyBasketBookIds = Array.isArray(basketData) ? basketData.map((item) => item.book_id) : [];
        } catch (fetchErr) {
          console.error("Error fetching user listings/basket during search:", fetchErr);
          // Continue with search even if user-specific data fetch fails, but log the error
        }
      }
      setMyListings(fetchedMyListings);
      setMyBasketBookIds(fetchedMyBasketBookIds);

      // Perform the actual book search using potentially newly fetched myBasketBookIds
      const results = await BookSearch({
        grade_numbers: filters.grade_numbers,
        title_q: debouncedTitle,
        basketBookIds: showMyBasketOnly ? fetchedMyBasketBookIds : null, // Use freshly fetched IDs
        sellerId: showMyBooksOnly ? user?.id : null
      });
      setGroupedResults(results);

    } catch (error) {
      console.error("Error performing search via integration:", error);
      setGroupedResults([]);
    }
    setLoading(false);
  }, [debouncedTitle, filters.grade_numbers, showMyBasketOnly, showMyBooksOnly, user?.id]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // New useEffect to fetch basket summary when basket changes
  useEffect(() => {
    if (user && myBasketBookIds) {
        fetchBasketSummary(myBasketBookIds);
    }
  }, [user, myBasketBookIds, fetchBasketSummary]);

  // New useEffect to auto-apply "My Basket" filter on initial load
  useEffect(() => {
    // Only auto-apply once, when all data is ready and conditions are met
    if (!hasAutoAppliedBasketFilter && 
        !loading && // Ensure main search is not loading
        !loadingSummary && 
        myBasketBookIds.length > 0 && 
        basketAvailabilitySummary.availableBooksCount > 0 &&
        !showMyBasketOnly && // Don't override if already manually set
        !showMyBooksOnly) { // Don't override if other filter is active
      
      setShowMyBasketOnly(true);
      setHasAutoAppliedBasketFilter(true);
    }
  }, [hasAutoAppliedBasketFilter, loading, loadingSummary, myBasketBookIds.length, basketAvailabilitySummary.availableBooksCount, showMyBasketOnly, showMyBooksOnly]);


  const handleListingDataChange = useCallback((updatedListing) => {
    setGroupedResults((prevResults) => {
      return prevResults.map((group) => {
        const updatedListings = group.listings.map((listing) =>
        listing.id === updatedListing.id ? { ...listing, ...updatedListing } : listing
        );
        // Only update the group if its listings have changed to prevent unnecessary re-renders
        if (updatedListings === group.listings) {
          return group;
        }
        return { ...group, listings: updatedListings };
      });
    });
  }, []);

  const resetFilters = () => {
    setFilters({ grade_numbers: [], title_q: "" });
    setShowMyBooksOnly(false);
    setShowMyBasketOnly(false); // Reset basket filter as well
    // By setting this to true, we prevent the auto-apply from running again after a manual clear.
    setHasAutoAppliedBasketFilter(true); 
  };

  const handleGradeToggle = (gradeId) => {
    setFilters((prev) => ({
      ...prev,
      grade_numbers: prev.grade_numbers.includes(gradeId) ?
      prev.grade_numbers.filter((id) => id !== gradeId) :
      [...prev.grade_numbers, gradeId]
    }));
  };

  const removeGrade = (gradeId) => {
    setFilters((prev) => ({
      ...prev,
      grade_numbers: prev.grade_numbers.filter((id) => id !== gradeId)
    }));
  };

  const handleAddBookFromSearchEmptyState = () => {
    // Determine if this would be the user's first listing
    const isFirstListing = myListings.length === 0;
    // Check if user profile (phone or city) is incomplete
    const profileIncomplete = user && (!user.phone_e164 || user.phone_e164.trim() === '' || !user.city || user.city.trim() === '');

    if (isFirstListing && profileIncomplete) {
      // If it's the first listing and profile is incomplete, open the profile dialog
      setShowProfileCompletionDialog(true);
    } else {
      // Otherwise, navigate to the BookCatalog page to add a book
      window.location.href = createPageUrl("BookCatalog?source=add_book");
    }
  };

  const handleMyBooksToggle = () => {
    const isTurningOn = !showMyBooksOnly;
    setShowMyBooksOnly(isTurningOn);
    if (isTurningOn) {
      setShowMyBasketOnly(false); // Ensure mutual exclusivity
    }
  };

  const handleMyBasketToggle = () => {
    const isTurningOn = !showMyBasketOnly;
    setShowMyBasketOnly(isTurningOn);
    if (isTurningOn) {
      setShowMyBooksOnly(false); // Ensure mutual exclusivity
    }
  };


  const filteredForDisplay = showMyBooksOnly ?
  groupedResults.filter((group) => group.seller.id === user?.id) :
  groupedResults.filter((group) => {
    return group.seller.id !== user?.id && group.listings.some((listing) => listing.status === 'available');
  });

  const totalAvailableListings = filteredForDisplay.reduce((acc, group) => acc + group.matchCount, 0);

  const showMyBasketEmptyState = showMyBasketOnly && myBasketBookIds.length === 0;

  return (
    <>
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Header with Filters */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                {/* Desktop Header and Filters - completely hidden on mobile */}
                <div className="hidden md:block">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-4">
                        <div className="flex justify-between items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">יריד הספרים</h1>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap mt-4">
                            {/* Popover for Grade Selection */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        שכבת לימוד
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-right">בחירת שכבות לימוד</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {GRADES.map((grade) =>
                        <div key={grade.id} className="flex items-center gap-2 flex-row-reverse">
                                                    <Checkbox
                            id={`grade-${grade.id}`}
                            checked={filters.grade_numbers.includes(grade.id)}
                            onCheckedChange={() => handleGradeToggle(grade.id)} />

                                                    <label htmlFor={`grade-${grade.id}`} className="text-sm cursor-pointer">
                                                        {grade.name.replace('כיתה ', '')}
                                                    </label>
                                                </div>
                        )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Grade Badges */}
                            {filters.grade_numbers.length > 0 &&
                <div className="flex flex-wrap gap-2">
                                    {filters.grade_numbers.map((gradeId) => {
                    const grade = GRADES.find((g) => g.id === gradeId);
                    return grade ?
                    <Badge key={gradeId} variant="secondary" className="flex items-center gap-1">
                                                {grade.name.replace('כיתה ', '')}
                                                <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeGrade(gradeId)} />

                                            </Badge> :
                    null;
                  })}
                                </div>
                }

                            {/* Search Input */}
                            <div className="relative w-full md:max-w-xs">
                                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                    placeholder="חפשו שם ספר..."
                    value={filters.title_q}
                    onChange={(e) => setFilters((p) => ({ ...p, title_q: e.target.value }))}
                    className="pr-10 w-full" />

                            </div>

                            {/* Filter Chips */}
                            <Button
                  onClick={handleMyBooksToggle}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  showMyBooksOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }>
                                ספרים שפירסמתי ({myListings.filter(l => l.status === 'available').length})
                            </Button>
                            <Button
                  onClick={handleMyBasketToggle}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  showMyBasketOnly ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }>

                                הסל שלי ({myBasketBookIds.length})
                            </Button>

                            {/* Reset Filters Button */}
                            {hasActiveFilters() && (
                                <Button variant="ghost" onClick={resetFilters} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                    <RotateCcw className="w-4 h-4" /> נקה סינון
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <HintBar
                  user={user}
                  pageType="fair"
                  userListingsCount={myListings.filter(l => l.status === 'available').length}
                  userBasketCount={myBasketBookIds.length}
                  basketAvailabilitySummary={basketAvailabilitySummary}
                  loadingSummary={loadingSummary}
                  isMyBasketFilterActive={showMyBasketOnly}
                />
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {!loading && (
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            תוצאות ({totalAvailableListings} ספרים זמינים)
                        </h2>
                        {hasActiveFilters() && (
                          <Button 
                            variant="ghost" 
                            onClick={resetFilters} 
                            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 md:hidden"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4" />
                            נקה סינון
                          </Button>
                        )}
                    </div>
                )}
                {loading ?
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div> :
          showMyBasketEmptyState ?
          <Card className="border-0 shadow-lg">
                        <CardContent className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">הסל שלכם ריק</h3>
                            <p className="text-gray-500">הוסיפו לסל ספרים שאתם מעוניינים להשיג</p>
                            <Button variant="outline" onClick={() => window.location.href = createPageUrl("BookCatalog")} className="mt-4">
                                חזרה לקטלוג
                            </Button>
                        </CardContent>
                    </Card> :
          showMyBooksOnly && filteredForDisplay.length === 0 ?
          <Card className="border-0 shadow-lg text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700">לא פרסמת ספרים למכירה</h3>
                        <p className="text-gray-500">התחילו על ידי הוספת ספר למכירה</p>
                        <Button onClick={handleAddBookFromSearchEmptyState} className="mt-4">
                            הוסף ספר למכירה
                        </Button>
                    </Card> :
          filteredForDisplay.length > 0 ?
          <SellerGroupList
            groupedResults={filteredForDisplay}
            GRADES={GRADES}
            user={user}
            showMyBooksOnly={showMyBooksOnly}
            onAddNewListingClick={handleAddBookFromSearchEmptyState}
            onFullDataRefresh={performSearch}
            onGranularUpdate={handleListingDataChange}
            onProfileNudgeClick={() => setShowProfileEditDialog(true)} /> :


          <Card className="border-0 shadow-lg">
                        <CardContent className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">לא נמצאו ספרים</h3>
                            <p className="text-gray-500">נסו לשנות את הסינונים או לחפש משהו אחר</p>
                            <Button variant="outline" onClick={resetFilters} className="mt-4">איפוס החיפוש</Button>
                        </CardContent>
                    </Card>
          }
            </div>

            {/* Profile Edit Dialog */}
            <ProfileEditDialog
          open={showProfileCompletionDialog}
          onOpenChange={setShowProfileCompletionDialog}
          currentUser={user}
          onProfileUpdated={async () => {
            // After profile is updated, immediately redirect to BookCatalog
            window.location.href = createPageUrl("BookCatalog?source=add_book");
          }} />

            {/* Profile Edit Dialog for Profile Nudge */}
            <ProfileEditDialog
              open={showProfileEditDialog}
              onOpenChange={setShowProfileEditDialog}
              currentUser={user}
              onProfileUpdated={async () => {
                // After profile is updated, refresh the BookFair page data
                const freshUser = await User.me(); // Explicitly fetch fresh user data
                setUser(freshUser); // Update the state
                setShowProfileEditDialog(false); // Close the dialog
                
                // Notify the Layout component that the profile was updated
                document.dispatchEvent(new CustomEvent('profile-updated'));
              }}
            />

        </div>

        <MobileFilterSheet
        open={isMobileFilterOpen}
        onOpenChange={setIsMobileFilterOpen}
        filters={filters}
        setFilters={setFilters}
        handleFilterGradeToggle={handleGradeToggle}
        removeFilterGrade={removeGrade}
        showMyBooksOnly={showMyBooksOnly}
        handleMyBooksToggle={handleMyBooksToggle}
        userListingsCount={myListings.filter(l => l.status === 'available').length}
        showMyBasketOnly={showMyBasketOnly}
        handleMyBasketToggle={handleMyBasketToggle}
        userBasketCount={myBasketBookIds.length}
        resetFilters={resetFilters}
        user={user}
        GRADES={GRADES}
        hasActiveFilters={hasActiveFilters()} />

        </>);

}
