import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BookCardListingButtons({
  isListed,
  isLoading,
  onEdit,
  onPublish
}) {
  if (isListed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={onEdit}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-xs flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "ערוך פרסום"
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-right">ניתן לערוך את פרטי המודעה</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          onClick={onPublish}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-xs flex-1"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "פרסם ביריד"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-right">אם הספר הזה נמצא ברשותך, את.ה יכול.ה לפרסם אותו ביריד הספרים הדיגיטלי וכך להציע אותו למסירה או מכירה לאחרים</p>
      </TooltipContent>
    </Tooltip>
  );
}