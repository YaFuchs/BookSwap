
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpenCheck } from "lucide-react";

export default function AvailabilityAndBasket({ 
    currentUser, 
    count, 
    isBookInBasket, 
    basketActionLoading, 
    onAddToBasket, 
    onRemoveFromBasket 
}) {
    return (
        <div className="space-y-2 bg-gray-50 p-4 rounded-lg border">
            <span className="font-semibold text-gray-700 text-sm text-right block w-full">זמינים ביריד:</span>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 min-w-0">
                {/* Availability Count */}
                <div className="flex-shrink-0">
                    {count > 0 ? (
                        <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1 flex items-center gap-1.5">
                            <BookOpenCheck className="h-4 w-4" />
                            <span>{count}</span>
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-sm text-gray-500 whitespace-nowrap">אין במלאי</Badge>
                    )}
                </div>
                
                {/* Basket Button */}
                <div className="min-w-0">
                    {currentUser ? (
                        isBookInBasket ? (
                            <Button variant="outline" className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700" onClick={onRemoveFromBasket} disabled={basketActionLoading}>
                                {basketActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "הסר מהסל"}
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full border-green-300 text-green-600 hover:bg-green-50" onClick={onAddToBasket} disabled={basketActionLoading}>
                                 {basketActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "הוסף לסל"}
                            </Button>
                        )
                    ) : (
                        <p className="text-xs text-center text-gray-500 pt-2">התחבר/י כדי להוסיף לסל</p>
                    )}
                </div>
            </div>
        </div>
    );
}

