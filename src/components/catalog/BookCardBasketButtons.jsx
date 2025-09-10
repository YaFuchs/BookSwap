import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BookCardBasketButtons({
  isInBasket,
  isLoading,
  onAddToBasket,
  onRemoveFromBasket
}) {
  if (isInBasket) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            onClick={onRemoveFromBasket}
            disabled={isLoading}
            className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "הסר מהסל"
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-right">הסר ספר זה מרשימת הספרים שאני מעוניין לקנות</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddToBasket}
          disabled={isLoading}
          className="text-xs border-green-300 text-green-600 hover:bg-green-50 flex-1"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "הוסף לסל"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-right">הוסף ספר זה לרשימת הספרים שאני מעוניינ.ת לקנות</p>
      </TooltipContent>
    </Tooltip>
  );
}