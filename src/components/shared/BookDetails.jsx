
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { SUBJECTS } from "../constants/subjects";
import { formatPrice } from "../utils/formatPrice";

export default function BookDetails({
  book,
  GRADES,
  isEditMode,
  editFormData,
  setEditFormData,
  isAddingNewBook
}) {
  // Note: handleInputChange and handleGradeToggle are no longer used
  // as per the new inline setEditFormData logic in edit mode.

  const displayBook = isEditMode ? editFormData : book;

  // Better null checking
  if (!displayBook && !isAddingNewBook) return null;
  if (isEditMode && !editFormData) return null;

  return (
    <div className="flex flex-col md:flex-row-reverse gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
                {displayBook?.cover_image_url ?
        <img
          src={displayBook.cover_image_url}
          alt={displayBook?.title_he || "ספר"}
          className="w-24 h-32 object-cover rounded-lg border" /> :


        <div className="w-24 h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
        }
            </div>

            {/* Book Details */}
            <div className="flex-1">
                {isEditMode ?
        <div className="space-y-4">
                        {/* Cover Image URL Input */}
                        <div>
                            <Label htmlFor="cover_image_url">כתובת תמונת השער</Label>
                            <Input
              id="cover_image_url"
              value={editFormData?.cover_image_url || ""}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, cover_image_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="mt-1" />

                        </div>

                        {/* Title Input */}
                        <div>
                            <Label htmlFor="title_he">כותרת הספר (חובה)</Label>
                            <Input
              id="title_he"
              value={editFormData?.title_he || ""}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, title_he: e.target.value }))}
              required
              className="mt-1 text-right" />

                        </div>

                        {/* Subject Select */}
                        <div>
                            <Label htmlFor="subject">נושא</Label>
                            <Select
              value={editFormData?.subject || ""}
              onValueChange={(value) => setEditFormData((prev) => ({ ...prev, subject: value }))}>

                                <SelectTrigger id="subject" className="w-full mt-1 text-right">
                                    <SelectValue placeholder="בחירת נושא" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBJECTS.map((s) =>
                <SelectItem key={s} value={s} className="text-right">
                                            {s}
                                        </SelectItem>
                )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Grade Checkboxes */}
                        <div>
                            <Label>שכבות לימוד (חובה)</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2 p-3 border rounded-md">
                                {GRADES.map((grade) =>
              <div key={grade.id} className="flex items-center gap-2 flex-row-reverse">
                                        <Checkbox
                  id={`grade-edit-${grade.id}`}
                  checked={(editFormData?.grade_numbers || []).includes(grade.id)}
                  onCheckedChange={(checked) => {
                    const currentGrades = editFormData?.grade_numbers || [];
                    const newGrades = checked ?
                    [...currentGrades, grade.id] :
                    currentGrades.filter((id) => id !== grade.id);
                    setEditFormData((prev) => ({ ...prev, grade_numbers: newGrades.sort((a, b) => a - b) }));
                  }} />

                                        <label htmlFor={`grade-edit-${grade.id}`} className="text-sm cursor-pointer">
                                            {grade.name}
                                        </label>
                                    </div>
              )}
                            </div>
                        </div>

                        {/* Recommended Price Input */}
                        <div className="text-right">
                            <Label htmlFor="recommended_price" className="text-sm font-medium">מחיר מומלץ (בשקלים)</Label>
                            <Input
              id="recommended_price"
              name="recommended_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="למשל 20.00"
              value={(editFormData.recommended_price ?? 0) / 100}
              onChange={(e) => {
                const shekels = parseFloat(e.target.value);
                const agorot = Math.round(shekels * 100);
                setEditFormData((prev) => ({ ...prev, recommended_price: isNaN(agorot) ? null : agorot }));
              }}
              className="w-32" />

                        </div>

                        {/* Admin Note Textarea */}
                        <div>
                            <Label htmlFor="admin_note">הערת אדמין</Label>
                            <Textarea
              id="admin_note"
              value={editFormData?.admin_note || ""}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, admin_note: e.target.value }))}
              placeholder="הערה שתוצג לקונים. למשל: מהדורה מיוחדת, דרוש ידע קודם וכו'..."
              className="mt-1 text-right"
              rows={3} />

                        </div>

                    </div> :

        <>
                        {/* View Mode */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {displayBook?.title_he || "ספר ללא שם"}
                            </h2>
                             {displayBook?.status === 'removed_from_catalog' &&
            <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap mb-2">
                                    הוסר מקטלוג הספרים
                                </Badge>
            }
                            {displayBook?.subject &&
            <p className="text-gray-600 mb-3">{displayBook.subject}</p>
            }
                            {/* Recommended Price Display */}
                            {displayBook?.recommended_price || displayBook?.recommended_price === 0 ?
            <div className="text-right">
                                    <p>
                                        <span className="text-sm font-medium text-gray-500">מחיר מומלץ: </span>
                                        <span className="text-sm font-bold">{formatPrice(displayBook.recommended_price)}</span>
                                    </p>
                                </div> :
            null}
                            {displayBook?.admin_note &&
            <p className="text-sm text-gray-500 mb-3">
                                    <span className="font-semibold">הערות: </span>
                                    {displayBook.admin_note}
                                </p>
            }
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(displayBook?.grade_numbers) && displayBook.grade_numbers.map((gradeNum) => {
                const grade = GRADES.find((g) => g.id === gradeNum);
                return grade ?
                <Badge key={gradeNum} variant="secondary">
                                            {grade.name}
                                        </Badge> :
                null;
              })}
                            </div>
                        </div>
                    </>
        }
            </div>
        </div>);

}