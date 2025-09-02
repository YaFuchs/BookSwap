
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
                        <div>
                            <Label htmlFor="recommended_price">מחיר מומלץ (באגורות)</Label>
                            <Input
              id="recommended_price"
              type="number"
              value={editFormData?.recommended_price || 0}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, recommended_price: parseInt(e.target.value, 10) || 0 }))}
              className="mt-1 text-right" />

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
                            {displayBook?.subject &&
            <p className="text-gray-600 mb-3">{displayBook.subject}</p>
            }
                            {displayBook?.recommended_price &&
            <p className="text-sm text-gray-500 mb-3">
                                    מחיר מומלץ: ₪{(displayBook.recommended_price / 100).toFixed(2)}
                                </p>
            }
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