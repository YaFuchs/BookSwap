import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, BookOpenCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BookCatalogDesktopTable({
  filteredBooks,
  availableCounts,
  user,
  isBookListed,
  isBookInBasket,
  actionLoading,
  handleRowClick,
  handleFastPublish,
  handleEditListing,
  handleAddToBasket,
  handleRemoveFromBasket,
  showMyBasketEmptyState,
  showMyBooksEmptyState,
  showEmptyCatalogState,
  showNoResultsState,
  resetFilters,
  GRADES,
}) {
  return (
    <TooltipProvider>
        <Card className="shadow-lg hidden md:block">
            <CardHeader><CardTitle className="text-2xl text-lg font-semibold leading-none tracking-tight">תוצאות ({filteredBooks.length} ספרים בקטלוג)</CardTitle></CardHeader>
            <CardContent className="p-2">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="text-right w-20 px-3 py-2">תמונה</TableHead>
                    <TableHead className="text-right px-3 py-2">פרטי הספר</TableHead>
                    <TableHead className="text-right px-3 py-2">זמינים ביריד</TableHead>
                    <TableHead className="text-right px-3 py-2">פעולות</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredBooks.length > 0 ? filteredBooks.map((book) => {
                    const count = availableCounts[book.id] || 0;
                    const bookListed = isBookListed(book.id);
                    const bookInBasket = isBookInBasket(book.id);
                    const isActionLoading = actionLoading[book.id]; // For listing actions
                    const isBasketActionLoading = actionLoading[`basket-${book.id}`]; // For basket actions

                    return (
                    <TableRow
                        key={book.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                        // Don't trigger row click if clicking on the action button or tooltip trigger
                        if (e.target.closest('button, [data-radix-tooltip-trigger]')) return;
                        handleRowClick(book);
                        }}>

                        <TableCell className="w-20 px-3 py-2 align-middle">
                        <div className="flex justify-center">
                            {book.cover_image_url ?
                            <img
                            src={book.cover_image_url}
                            alt={book.title_he}
                            className="w-16 h-20 object-cover rounded flex-shrink-0" /> :
                            <div
                            className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            }
                        </div>
                        </TableCell>
                        <TableCell className="px-3 py-4 align-top">
                        <div>
                            <div className="text-lg font-bold text-gray-900">{book.title_he}</div>
                            {book.subject && <div className="text-sm text-gray-600 mt-1">{book.subject}</div>}
                            <div className="flex flex-wrap gap-1 mt-2">
                            {Array.isArray(book.grade_numbers) && book.grade_numbers.slice(0, 5).map((gradeNum) => {
                                const grade = GRADES.find((g) => g.id === gradeNum);
                                return grade ? <Badge key={gradeNum} variant="secondary" className="text-xs whitespace-nowrap">{grade.name}</Badge> : null;
                            })}
                            {Array.isArray(book.grade_numbers) && book.grade_numbers.length > 5 && <span className="text-xs text-gray-500">...</span>}
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="px-3 py-4 align-middle text-right">
                        {count > 0 ?
                        <Badge className="bg-green-100 text-green-800 text-sm flex items-center gap-1.5 max-w-[65px] justify-center">
                            <BookOpenCheck className="w-4 h-4" />
                            <span className="truncate">{count}</span>
                            </Badge> :
                        <span className="text-sm text-gray-500">אין במלאי</span>
                        }
                        </TableCell>
                        <TableCell className="px-3 py-4 align-middle text-center">
                        {user ?
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Listing Actions */}
                            {bookListed ?
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditListing(book);
                                }}
                                disabled={isActionLoading}
                                className="bg-green-600 hover:bg-green-700 text-xs min-w-[82px]">
                                    {isActionLoading ?
                                <Loader2 className="w-3 h-3 animate-spin" /> :
                                "ערוך פרסום"
                                }
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-right">ניתן לערוך את פרטי המודעה</p>
                                </TooltipContent>
                                </Tooltip> :
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFastPublish(book);
                                }}
                                disabled={isActionLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-xs min-w-[82px]">
                                    {isActionLoading ?
                                <Loader2 className="w-3 h-3 animate-spin" /> :
                                "פרסם ביריד"
                                }
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-right">אם הספר הזה נמצא ברשותך, ניתן לפרסם אותו ביריד הספרים ולהציע אותו למכירה לאחרים. </p>
                                </TooltipContent>
                                </Tooltip>
                            }

                            {/* Basket Actions */}
                            {bookInBasket ?
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromBasket(book);
                                }}
                                disabled={isBasketActionLoading}
                                className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 min-w-[82px]">
                                    {isBasketActionLoading ?
                                <Loader2 className="w-3 h-3 animate-spin" /> :
                                "הסר מהסל"
                                }
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-right">הסר ספר זה מרשימת הספרים שאני מעוניין לקנות</p>
                                </TooltipContent>
                                </Tooltip> :
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToBasket(book);
                                }}
                                disabled={isBasketActionLoading}
                                className="text-xs border-green-300 text-green-600 hover:bg-green-50 min-w-[82px]">
                                    {isBasketActionLoading ?
                                <Loader2 className="w-3 h-3 animate-spin" /> :
                                "הוסף לסל"
                                }
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-right">הוספת ספר זה לרשימת הספרים המעניינים אותי</p>
                                </TooltipContent>
                                </Tooltip>
                            }
                            </div> :
                        <span className="text-xs text-gray-400">התחבר לפעולות</span>
                        }
                        </TableCell>
                    </TableRow>);
                }) :
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 px-3 py-2">
                        {showMyBasketEmptyState ?
                    <div className="flex flex-col items-center gap-2">
                            <span>הסל שלכם ריק, הוסיפו לסל ספרים שאתם מעוניינים להשיג</span>
                        </div> :
                    showMyBooksEmptyState ?
                    <div className="flex flex-col items-center gap-2">
                            <h3 className="text-xl font-semibold text-gray-700">לא פרסמת ספרים למכירה</h3>
                            <p className="text-gray-500">פרסמו ספרים מהקטלוג כדי שיופיעו כאן</p>
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                                עיון בקטלוג
                            </Button>
                            </div> :
                    showEmptyCatalogState ?
                    "אין ספרים בקטלוג." :
                    showNoResultsState ?
                    <div className="flex flex-col items-center gap-2">
                                <span>לא נמצאו ספרים</span>
                                <Button variant="outline" size="sm" onClick={resetFilters}>
                                    איפוס החיפוש
                                </Button>
                                </div> :
                    "אין ספרים בקטלוג."
                    }
                    </TableCell>
                    </TableRow>
                }
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </TooltipProvider>
  );
}