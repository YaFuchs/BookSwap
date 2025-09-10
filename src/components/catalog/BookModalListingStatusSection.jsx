
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserListingDetails from "../shared/UserListingDetails";

export default function BookModalListingStatusSection({
  isEditMode,
  isAddingNewBook,
  isLoadingCheck,
  isBookListed,
  userSpecificListingLoading,
  userSpecificListing,
  currentUser,
  book, // book prop is still needed for display purposes (e.g. checkmark message)
  isFastPublishing, // New prop from hook
  onFastPublish, // New prop from hook
  onListingUpdate,
  onGranularUpdate
}) {

  if (isEditMode || isAddingNewBook) {
    return null;
  }
  
  const motionVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div className="mt-8">
      <AnimatePresence mode="wait">
        {isLoadingCheck ? (
          <motion.div
            key="loading"
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-blue-50 rounded-xl p-6 text-center"
          >
            <div className="flex justify-center items-center h-24">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          </motion.div>
        ) : isBookListed ? (
          <motion.div
            key="listed"
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {userSpecificListingLoading ? (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              </div>
            ) : userSpecificListing ? (
              <UserListingDetails 
                listing={userSpecificListing} 
                onListingUpdate={onListingUpdate}
                onGranularUpdate={onGranularUpdate}
              />
            ) : (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="flex flex-col items-center justify-center h-24 text-green-700">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <p className="font-semibold text-sm">ספר זה נמצא בספרים שפירסמת ביריד הספרים</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="unlisted"
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-blue-50 rounded-xl p-6 text-center"
          >
            <p className="text-blue-800 font-medium text-sm mb-2">
              מעוניינים למסור או למכור את הספר הזה?
            </p>
            
            <Button
              onClick={onFastPublish} // Use the new onFastPublish prop
              className="mt-4 bg-green-600 hover:bg-green-700"
              disabled={!currentUser || isFastPublishing} // Use the new isFastPublishing prop
            >
              {isFastPublishing && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              הוסף את הספר הזה לפרסום ביריד
            </Button>
            
            {!currentUser && <p className="text-xs text-gray-500 mt-2">עליך להיות מחובר כדי להוסיף ספרים.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
