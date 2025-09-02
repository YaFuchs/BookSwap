import { Book } from "@/api/entities";
import { Listing } from "@/api/entities";
import { getPublicUserProfiles } from "@/api/functions";

export const BookSearch = async ({ grade_numbers, title_q, basketBookIds, sellerId }) => {
    try {
        // 1. Prepare initial book ID filters
        let bookIdsFromFilters = [];
        let otherFiltersActive = (grade_numbers && grade_numbers.length > 0) || !!title_q;

        if (otherFiltersActive) {
            // Fetch ALL books regardless of status to support "My Basket" view with removed books
            let filteredBooks = await Book.list();
            
            if (grade_numbers && grade_numbers.length > 0) {
                filteredBooks = filteredBooks.filter(book => 
                    book.grade_numbers && book.grade_numbers.some(grade => grade_numbers.includes(grade))
                );
            }
            if (title_q) {
                filteredBooks = filteredBooks.filter(book => 
                    book.title_he.toLowerCase().includes(title_q.toLowerCase())
                );
            }
            
            // Apply status filter: only show active books UNLESS we're in basket mode
            const isBasketMode = basketBookIds && basketBookIds.length > 0;
            if (!isBasketMode) {
                filteredBooks = filteredBooks.filter(book => book.status === 'active');
            }
            
            bookIdsFromFilters = filteredBooks.map(b => b.id);

            // If other filters are active but result in no matching books, no need to proceed
            if (bookIdsFromFilters.length === 0) return [];
        }

        // 2. Build the final list of book IDs for the Listing query
        let finalBookIdsForQuery;
        const basketFilterActive = basketBookIds && basketBookIds.length > 0;

        if (basketFilterActive) {
            if (otherFiltersActive) {
                // Intersect basket IDs with other filter results
                const filterSet = new Set(bookIdsFromFilters);
                finalBookIdsForQuery = basketBookIds.filter(id => filterSet.has(id));
            } else {
                // Only basket filter is active
                finalBookIdsForQuery = basketBookIds;
            }
        } else {
            finalBookIdsForQuery = bookIdsFromFilters;
        }

        // If after all filtering there are no book IDs to search for, return early
        if (otherFiltersActive && finalBookIdsForQuery.length === 0) {
            return [];
        }

        // 3. Fetch listings based on the final list of book IDs
        let listingsQuery = {};
        
        // Status filter: if sellerId is provided, fetch all statuses for that seller
        // Otherwise, only fetch available listings for public view
        if (sellerId) {
            listingsQuery.seller_id = sellerId;
            // No status filter - fetch both available and sold for the seller
        } else {
            listingsQuery.status = 'available';
        }
        
        if (finalBookIdsForQuery && finalBookIdsForQuery.length > 0) {
            listingsQuery.book_id = { $in: finalBookIdsForQuery };
        } else if (basketFilterActive) {
            // Basket filter was on but resulted in no IDs (e.g., empty basket)
            return [];
        }

        const listingsData = await Listing.filter(listingsQuery);

        if (listingsData.length === 0) {
            return [];
        }

        // 4. Fetch all books and sellers related to the found listings
        const allBookIds = [...new Set(listingsData.map(l => l.book_id))];
        const allSellerIds = [...new Set(listingsData.map(l => l.seller_id))];

        const [allBooksData, sellersResponse] = await Promise.all([
            // Fetch ALL books (including removed ones) for complete data
            Book.filter({ id: { $in: allBookIds } }),
            getPublicUserProfiles({ userIds: allSellerIds })
        ]);
        
        const booksMap = (Array.isArray(allBooksData) ? allBooksData : []).reduce((acc, book) => {
            acc[book.id] = book;
            return acc;
        }, {});

        let sellersMap = {};
        if (sellersResponse.data) {
            sellersMap = sellersResponse.data.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});
        }
        
        // 5. Group listings by seller and combine with book data
        const sellerGroups = {};
        listingsData.forEach(listing => {
            const seller = sellersMap[listing.seller_id];
            const book = booksMap[listing.book_id];
            
            // Ensure both seller and book data exist for a valid listing
            if (!seller || !book) return;

            if (!sellerGroups[listing.seller_id]) {
                sellerGroups[listing.seller_id] = {
                    seller: seller,
                    listings: [],
                    matchCount: 0
                };
            }

            sellerGroups[listing.seller_id].listings.push({ ...listing, book });
            if (listing.status === 'available') {
                sellerGroups[listing.seller_id].matchCount++;
            }
        });

        const validGroups = Object.values(sellerGroups).filter(g => g.listings.length > 0);

        // 6. Sort results
        validGroups.sort((a, b) => {
            if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
            const aNewest = Math.max(...a.listings.map(l => new Date(l.created_date).getTime()));
            const bNewest = Math.max(...b.listings.map(l => new Date(l.created_date).getTime()));
            return bNewest - aNewest;
        });

        return validGroups;
    } catch (error) {
        console.error("Error in BookSearch integration:", error);
        throw error;
    }
};