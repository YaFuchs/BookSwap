
import { useState, useEffect, useCallback, useRef } from "react";
import { Book, User, Listing, Basket } from "@/api/entities";
import { getBookAvailableCounts } from "@/api/functions";
import { getBasketAvailabilitySummary } from "@/api/functions";

export function useBookCatalogData(user, notify) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userListings, setUserListings] = useState([]);
  const [userBasketBooks, setUserBasketBooks] = useState([]);
  const [availableCounts, setAvailableCounts] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [basketAvailabilitySummary, setBasketAvailabilitySummary] = useState({ availableBooksCount: 0, uniqueSellersCount: 0 });
  const refreshTimeoutRef = useRef(null);
  const lastDataLoadRef = useRef(0);
  const isLoadingRef = useRef(false);
  const hasInitialLoadedRef = useRef(false);

  // Add throttling to prevent rapid successive API calls
  const THROTTLE_DELAY = 3000;

  // Create a stable reference to notify to avoid dependency issues
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const loadData = useCallback(async () => {
    // Prevent multiple initial loads
    if (hasInitialLoadedRef.current) {
      console.log("Initial load already completed, skipping");
      return;
    }

    // Throttle rapid successive calls
    const now = Date.now();
    if (now - lastDataLoadRef.current < THROTTLE_DELAY || isLoadingRef.current) {
      console.log("Throttling data load to prevent rate limits");
      return;
    }

    lastDataLoadRef.current = now;
    isLoadingRef.current = true;
    setLoading(true);
    hasInitialLoadedRef.current = true;
    
    try {
      const currentUser = await User.me().catch(() => null);

      // Fetch ALL books regardless of status
      const booksData = await Book.list("-created_date");
      setBooks(Array.isArray(booksData) ? booksData : []);

      // Only fetch user-specific data if user is authenticated
      if (currentUser) {
        // Sequential API calls with delays
        try {
          const listings = await Listing.filter({ seller_id: currentUser.id });
          setUserListings(Array.isArray(listings) ? listings : []);
        } catch (error) {
          console.error("Error fetching listings:", error);
          setUserListings([]);
        }

        // Wait before next API call
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const basketItems = await Basket.filter({ buyer_id: currentUser.id });
          setUserBasketBooks(Array.isArray(basketItems) ? basketItems : []);
        } catch (error) {
          console.error("Error fetching basket:", error);
          setUserBasketBooks([]);
        }

        // Wait before counts API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch counts with better error handling
        try {
          const countsResponse = await getBookAvailableCounts();
          if (countsResponse && countsResponse.data) {
            setAvailableCounts(countsResponse.data);
          } else {
            setAvailableCounts({});
          }
        } catch (error) {
          console.error("Error fetching book counts (non-critical):", error);
          // Only show notification for non-rate limit errors
          if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
            notifyRef.current?.error("שגיאה בטעינת ספירת ספרים", "הנתונים יתעדכנו בהמשך");
          }
          setAvailableCounts({});
        }
      } else {
        setAvailableCounts({});
        setUserListings([]);
        setUserBasketBooks([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Only show notification for non-rate limit errors
      if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
        notifyRef.current?.error("שגיאה בטעינת נתונים", "אנא נסו לרענן את הדף");
      }
      setBooks([]);
      setAvailableCounts({});
      setUserListings([]);
      setUserBasketBooks([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Empty dependency array since we use refs for dynamic values

  // New lightweight refresh function
  const refreshDataWithoutLoading = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("Refresh already in progress, skipping");
      return;
    }

    try {
      const currentUser = await User.me().catch(() => null);

      if (currentUser) {
        const listings = await Listing.filter({ seller_id: currentUser.id }).catch(() => []);
        setUserListings(Array.isArray(listings) ? listings : []);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const basketItems = await Basket.filter({ buyer_id: currentUser.id }).catch(() => []);
        setUserBasketBooks(Array.isArray(basketItems) ? basketItems : []);

        setTimeout(async () => {
          try {
            const countsResponse = await getBookAvailableCounts();
            if (countsResponse && countsResponse.data) {
              setAvailableCounts(countsResponse.data);
            }
          } catch (error) {
            console.error("Error refreshing book counts (non-critical):", error);
          }
        }, 300);
      } else {
        setUserListings([]);
        setUserBasketBooks([]);
        setAvailableCounts({});
      }
    } catch (error) {
      console.error("Error refreshing data without loading state:", error);
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
      setBasketAvailabilitySummary({ availableBooksCount: 0, uniqueSellersCount: 0 });
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const refreshCountsAndListings = useCallback(async () => {
    if (!user) return { listings: [], basketItems: [], counts: {} };

    const now = Date.now();
    if (now - lastDataLoadRef.current < 2000) {
      console.log("Throttling refresh to prevent rate limits");
      return { listings: userListings, basketItems: userBasketBooks, counts: availableCounts };
    }

    lastDataLoadRef.current = now;

    try {
      const listings = await Listing.filter({ seller_id: user.id }).catch(() => []);
      const safeListings = Array.isArray(listings) ? listings : [];
      setUserListings(safeListings);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      const basketItems = await Basket.filter({ buyer_id: user.id }).catch(() => []);
      const safeBasketItems = Array.isArray(basketItems) ? basketItems : [];
      setUserBasketBooks(safeBasketItems);

      let counts = availableCounts;
      
      // Use setTimeout to get counts after updating the listings/basket
      setTimeout(async () => {
        try {
          const countsResponse = await getBookAvailableCounts();
          if (countsResponse && countsResponse.data) {
            counts = countsResponse.data;
            setAvailableCounts(counts);
          }
        } catch (error) {
          console.error("Error refreshing book counts (non-critical):", error);
          if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
            notifyRef.current?.error("שגיאה בעדכון נתונים", "הנתונים יתעדכנו בהמשך");
          }
        }
      }, 300);

      return { listings: safeListings, basketItems: safeBasketItems, counts };
    } catch (error) {
      console.error("Error refreshing counts and listings:", error);
      if (!error.message?.includes('Rate limit') && !error.message?.includes('429')) {
        notifyRef.current?.error("שגיאה בעדכון נתונים", "אנא נסו שוב מאוחר יותר");
      }
      return { listings: [], basketItems: [], counts: {} };
    }
  }, [user, userListings, userBasketBooks, availableCounts]);

  const debouncedRefreshCountsAndListings = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshCountsAndListings();
    }, 1500);
  }, [refreshCountsAndListings]);

  // --- New Granular State Updaters ---
  const updateBookInList = useCallback((updatedBook) => {
    setBooks(currentBooks =>
      currentBooks.map(book =>
        book.id === updatedBook.id ? updatedBook : book
      )
    );
  }, []);

  const removeBookFromList = useCallback((bookId) => {
    setBooks(currentBooks =>
      currentBooks.filter(book => book.id !== bookId)
    );
  }, []);


  // Initial data load effect
  useEffect(() => {
    if (!hasInitialLoadedRef.current) {
        loadData();
    }
  }, [loadData]);

  // Fetch basket summary when user or basket changes
  useEffect(() => {
    if (user && userBasketBooks) {
      const basketIds = userBasketBooks.map((item) => item.book_id);
      const timeoutId = setTimeout(() => {
        fetchBasketSummary(basketIds);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [user, userBasketBooks, fetchBasketSummary]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
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
    updateBookInList,
    removeBookFromList,
  };
}
