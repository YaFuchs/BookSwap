import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import BookAvailabilityBadge from "../common/BookAvailabilityBadge";

export default function AvailabilityAndBasket({
    currentUser,
    count,
    isBookInBasket,
    basketActionLoading,
    onAddToBasket,
    onRemoveFromBasket
}) {
    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm w-full space-y-4">
            {/* Availability */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">זמינים ביריד:</span>
                <BookAvailabilityBadge count={count} />
            </div>

            {/* Basket Actions */}
            {currentUser && (
                <div className="pt-4 border-t border-gray-100">
                    {isBookInBasket ? (
                        <Button
                            variant="outline"
                            onClick={onRemoveFromBasket}
                            disabled={basketActionLoading}
                            className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        >
                            {basketActionLoading ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                                "הסר מהסל"
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onAddToBasket}
                            disabled={basketActionLoading}
                            className="w-full text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                        >
                            {basketActionLoading ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                                "הוסף לסל"
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}