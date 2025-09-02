
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, EyeOff, RotateCcw, Pencil, MessageCircle } from "lucide-react";
import moment from "moment";
import { Listing } from "@/api/entities";
import { formatPrice } from "../utils/formatPrice";

export default function UserListingDetails({ listing, onListingUpdate, onGranularUpdate }) {
  // Interactive state variables moved from ListingDetailsModal
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);

  // Inline editing states for price
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState("");
  const [loadingPriceSave, setLoadingPriceSave] = useState(false);

  // Inline editing states for condition
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const [editedCondition, setEditedCondition] = useState("");
  const [loadingConditionSave, setLoadingConditionSave] = useState(false);

  useEffect(() => {
    if (listing) {
      setEditedPrice(listing.price_agorot ? (listing.price_agorot / 100).toFixed(2) : "");
      setEditedCondition(listing.condition_note || "");
    }
    // Reset all edit modes when listing changes
    setIsEditingPrice(false);
    setIsEditingCondition(false);
  }, [listing]);

  // Handler functions moved from ListingDetailsModal
  const handleDeleteListing = async () => {
    if (!listing?.isCurrentUserListing || loadingDelete) return;
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המודעה?')) {
      setLoadingDelete(true);
      try {
        await Listing.delete(listing.id);
        if (onListingUpdate) {
          onListingUpdate();
        }
      } catch (error) {
        console.error("Failed to delete listing:", error);
        alert("שגיאה במחיקת המודעה.");
      } finally {
        setLoadingDelete(false);
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!listing?.isCurrentUserListing || loadingToggle) return;

    setLoadingToggle(true);
    const newStatus = listing.status === 'available' ? 'sold' : 'available';
    const updateData = { status: newStatus, sold_at: newStatus === 'sold' ? new Date().toISOString() : null };

    try {
      const updatedListing = await Listing.update(listing.id, updateData);
      if (onGranularUpdate) {
        onGranularUpdate({ ...listing, ...updatedListing });
      }
      if (onListingUpdate) {
        setTimeout(() => onListingUpdate(), 500);
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("שגיאה בעדכון סטטוס המודעה.");
    } finally {
      setLoadingToggle(false);
    }
  };

  // Price editing handlers
  const handleEditPriceClick = () => {
    setIsEditingPrice(true);
  };

  const handleSavePriceClick = async () => {
    const parsedPrice = parseFloat(editedPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("מחיר לא חוקי. אנא הזן מספר חיובי.");
      return;
    }
    setLoadingPriceSave(true);
    try {
      const priceInAgorot = Math.round(parsedPrice * 100);
      const updatedListing = await Listing.update(listing.id, { price_agorot: priceInAgorot });

      setIsEditingPrice(false);

      if (onGranularUpdate) {
        onGranularUpdate({ ...listing, ...updatedListing });
      }
    } catch (error) {
      console.error("Failed to update price:", error);
      alert("שגיאה בעדכון המחיר: " + error.message);
    } finally {
      setLoadingPriceSave(false);
    }
  };

  // Condition editing handlers
  const handleEditConditionClick = () => {
    setIsEditingCondition(true);
  };

  const handleSaveConditionClick = async () => {
    setLoadingConditionSave(true);
    try {
      const updatedListing = await Listing.update(listing.id, { condition_note: editedCondition });

      setIsEditingCondition(false);

      if (onGranularUpdate) {
        onGranularUpdate({ ...listing, ...updatedListing });
      }
    } catch (error) {
      console.error("Failed to update condition:", error);
      alert("שגיאה בעדכון מצב הספר: " + error.message);
    } finally {
      setLoadingConditionSave(false);
    }
  };

  const handleWhatsApp = () => {
    const message = listing.book?.title_he 
        ? `היי, מצאתי ב-BookSwap את הספר *${listing.book.title_he}* ואשמח לקנות אותו.`
        : `היי, ראיתי את הספרים שלך ב-BookSwap ואני מעוניין/ת.`;
    window.open(`https://api.whatsapp.com/send?phone=${listing.seller?.phone_e164}&text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!listing) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-900">
          {listing.isCurrentUserListing
            ? "מודעה זאת נמצאת בספרים שפירסמת"
            : `מודעה של ${listing.seller?.display_name || listing.seller?.full_name}${listing.seller?.city ? ` מ${listing.seller.city}` : ''}`}
        </h3>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {listing.isCurrentUserListing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteListing}
              disabled={loadingDelete}
              className="flex items-center gap-1"
            >
              {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              הסר פרסום
            </Button>
          )}
          {!listing.isCurrentUserListing && listing.seller?.phone_e164 && listing.seller?.show_phone && (
            <Button
              size="sm"
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Price - Interactive */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">מחיר:</span>
          {listing.isCurrentUserListing && isEditingPrice ? (
            <div className="flex flex-col items-end gap-2 w-full max-w-xs">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="לדוגמה: 20.00"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                className="text-sm text-right"
                disabled={loadingPriceSave}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePriceClick} disabled={loadingPriceSave} className="w-16 justify-center">
                  {loadingPriceSave ? <Loader2 className="h-3 w-3 animate-spin" /> : "שמור"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingPrice(false)} disabled={loadingPriceSave} className="w-16 justify-center">
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-green-600">
                {formatPrice(listing.price_agorot)}
              </span>
              {listing.isCurrentUserListing && (
                <Button variant="ghost" size="sm" onClick={handleEditPriceClick} className="p-1">
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Condition - Interactive */}
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-700">מצב הספר:</span>
          {listing.isCurrentUserListing && isEditingCondition ? (
            <div className="flex flex-col items-end gap-2 w-full max-w-xs">
              <Input
                placeholder="מצב הספר"
                value={editedCondition}
                onChange={(e) => setEditedCondition(e.target.value)}
                className="text-sm text-right"
                disabled={loadingConditionSave}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveConditionClick} disabled={loadingConditionSave} className="w-16 justify-center">
                  {loadingConditionSave ? <Loader2 className="h-3 w-3 animate-spin" /> : "שמור"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingCondition(false)} disabled={loadingConditionSave} className="w-16 justify-center">
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 text-right max-w-xs">
                {listing.condition_note || "לא צוין"}
              </span>
              {listing.isCurrentUserListing && (
                <Button variant="ghost" size="sm" onClick={handleEditConditionClick} className="p-1">
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">עודכן לאחרונה:</span>
          <span className="text-sm text-gray-600">
            {moment(listing.updated_date).format('DD/MM/YYYY')}
          </span>
        </div>

        {/* Status Badge with Toggle */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">סטטוס:</span>
          <div className="flex items-center gap-2">
            <Badge className={listing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {listing.status === 'available' ? 'זמין' : 'נמכר'}
            </Badge>
            {listing.isCurrentUserListing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={loadingToggle}
                className="flex items-center gap-1"
              >
                {loadingToggle ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : listing.status === 'available' ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    סמן כנמכר
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3" />
                    החזר לזמין
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
