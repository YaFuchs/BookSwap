
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserListingDetails from "../shared/UserListingDetails";
import BookDetails from "../shared/BookDetails";

export default function ListingDetailsModal({ listing, open, onOpenChange, GRADES, user, onListingUpdate, onGranularUpdate }) {
  const [currentListing, setCurrentListing] = useState(listing);

  useEffect(() => {
    // Update local state when the prop changes
    setCurrentListing(listing);
  }, [listing, open]);

  const handleListingChange = () => {
    onOpenChange(false);
    if (onListingUpdate) {
      onListingUpdate();
    }
  };

  // Handle granular updates from UserListingDetails
  const handleGranularUpdate = (updatedListing) => {
    // Update local state immediately for UI responsiveness
    setCurrentListing(updatedListing);
    
    // Also pass the update up to the parent component if needed
    if (onGranularUpdate) {
      onGranularUpdate(updatedListing);
    }
  };

  if (!currentListing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="text-right flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold text-gray-900">
            פרטי המודעה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Use the new BookDetails component */}
          <BookDetails 
            book={currentListing.book}
            GRADES={GRADES}
          />

          <UserListingDetails 
            listing={currentListing}
            onListingUpdate={handleListingChange}
            onGranularUpdate={handleGranularUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
