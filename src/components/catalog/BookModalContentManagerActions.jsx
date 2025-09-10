
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookModalContentManagerActions({
  user,
  book,
  isAddingNewBook,
  isEditMode,
  onSetIsEditMode,
  onBookDeleted,
  onBookCatalogDataChange,
  loadingDelete,
  onRemoveFromCatalog
}) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);

  if (!user?.is_content_manager || isAddingNewBook || isEditMode) {
    return null;
  }

  // No alert() calls are present in this component, so nothing needs to be removed.
  // The onRemoveFromCatalog function is expected to handle its own notifications (e.g., via useAppNotifications)
  // as it is passed from a parent component (like useBookDetails).

  return (
    <div className="border-t border-gray-200 pt-6 mt-8">
      <div className="bg-orange-50 rounded-lg border border-orange-200 transition-all">
        <button
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="flex items-center justify-between w-full p-3 text-right"
        >
          <span className="text-sm font-semibold text-orange-800">
            פעולות של מנהל תוכן
          </span>
          {isSectionExpanded ? (
            <ChevronUp className="w-5 h-5 text-orange-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-orange-600" />
          )}
        </button>

        <AnimatePresence>
          {isSectionExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 pb-3 px-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSetIsEditMode(true);
                    setIsSectionExpanded(false);
                  }}
                  className="flex items-center gap-1 bg-white"
                  disabled={book?.status === "removed_from_catalog"}
                >
                  <Edit className="h-4 w-4 hidden sm:inline-block" /> עריכת ספר
                  בקטלוג
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRemoveFromCatalog}
                  disabled={loadingDelete || book?.status === "removed_from_catalog"}
                  className="flex items-center gap-1"
                >
                  {loadingDelete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 hidden sm:inline-block" />
                  )}
                  הסר מהקטלוג
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
