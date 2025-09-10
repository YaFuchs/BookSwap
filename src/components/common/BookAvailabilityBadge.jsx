import React from 'react';
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck } from "lucide-react";

export default function BookAvailabilityBadge({ count }) {
  if (count > 0) {
    return (
      <Badge className="bg-green-100 text-green-800 text-sm flex items-center gap-1.5 max-w-[65px] justify-center">
        <BookOpenCheck className="w-4 h-4" />
        <span className="truncate">{count}</span>
      </Badge>
    );
  }

  return (
    <span className="text-sm text-gray-500">אין במלאי</span>
  );
}