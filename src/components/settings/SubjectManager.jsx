import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Save, X, BookOpen } from "lucide-react";
import { useSubjects } from "../hooks/useSubjects";
import { useAppNotifications } from "../hooks/useAppNotifications";
import { createSubject } from "@/api/functions";
import { updateSubject } from "@/api/functions";
import { deleteSubject } from "@/api/functions";

export default function SubjectManager() {
    const { subjects, loading, refetch } = useSubjects();
    const notify = useAppNotifications();
    
    const [newSubjectName, setNewSubjectName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [actionLoading, setActionLoading] = useState({});

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;

        setIsAdding(true);
        try {
            const response = await createSubject({ name: newSubjectName.trim() });
            if (response.data?.success) {
                notify.success("נושא נוסף", `נושא "${newSubjectName}" נוסף בהצלחה`);
                setNewSubjectName("");
                await refetch();
            }
        } catch (error) {
            console.error("Error adding subject:", error);
            if (error.message?.includes('409') || error.message?.includes('unique')) {
                notify.error("נושא כבר קיים", "נושא עם השם הזה כבר קיים במערכת");
            } else {
                notify.error("שגיאה בהוספת נושא", "לא ניתן להוסיף את הנושא");
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleStartEdit = (subject) => {
        setEditingId(subject.id);
        setEditingName(subject.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleUpdateSubject = async (subjectId) => {
        if (!editingName.trim()) return;

        setActionLoading(prev => ({ ...prev, [`update-${subjectId}`]: true }));
        try {
            const response = await updateSubject({ 
                subjectId, 
                updateData: { name: editingName.trim() } 
            });
            if (response.data?.success) {
                notify.success("נושא עודכן", "הנושא עודכן בהצלחה");
                setEditingId(null);
                setEditingName("");
                await refetch();
            }
        } catch (error) {
            console.error("Error updating subject:", error);
            if (error.message?.includes('409') || error.message?.includes('unique')) {
                notify.error("נושא כבר קיים", "נושא עם השם הזה כבר קיים במערכת");
            } else {
                notify.error("שגיאה בעדכון נושא", "לא ניתן לעדכן את הנושא");
            }
        } finally {
            setActionLoading(prev => ({ ...prev, [`update-${subjectId}`]: false }));
        }
    };

    const handleDeleteSubject = async (subject) => {
        if (!confirm(`האם אתם בטוחים שברצונכם למחוק את הנושא "${subject.name}"?`)) {
            return;
        }

        setActionLoading(prev => ({ ...prev, [`delete-${subject.id}`]: true }));
        try {
            const response = await deleteSubject({ subjectId: subject.id });
            if (response.data?.success) {
                notify.success("נושא נמחק", `נושא "${subject.name}" נמחק בהצלחה`);
                await refetch();
            }
        } catch (error) {
            console.error("Error deleting subject:", error);
            notify.error("שגיאה במחיקת נושא", "לא ניתן למחוק את הנושא");
        } finally {
            setActionLoading(prev => ({ ...prev, [`delete-${subject.id}`]: false }));
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="mr-2 text-gray-600">טוען נושאים...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <CardTitle>ניהול רשימת נושאים</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {subjects.length} נושאים
                    </Badge>
                </div>
                <CardDescription>
                    ניהול רשימת הנושאים הזמינים עבור ספרי הלימוד. נושאים אלה יוצגו בטופס הוספת/עריכת ספרים.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add New Subject Form */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <form onSubmit={handleAddSubject} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="new-subject" className="sr-only">
                                הוסף נושא חדש
                            </Label>
                            <Input
                                id="new-subject"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="הכנס שם נושא חדש..."
                                disabled={isAdding}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!newSubjectName.trim() || isAdding}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isAdding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 ml-2" />
                                    הוסף
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Subjects List */}
                <div className="space-y-2">
                    {subjects.length > 0 ? (
                        subjects.map(subject => (
                            <div
                                key={subject.id}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                            >
                                {editingId === subject.id ? (
                                    // Edit mode
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="flex-1"
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdateSubject(subject.id)}
                                            disabled={!editingName.trim() || actionLoading[`update-${subject.id}`]}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {actionLoading[`update-${subject.id}`] ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Save className="w-3 h-3" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    // View mode
                                    <>
                                        <span className="font-medium text-gray-900">
                                            {subject.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStartEdit(subject)}
                                                disabled={editingId !== null}
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteSubject(subject)}
                                                disabled={actionLoading[`delete-${subject.id}`] || editingId !== null}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            >
                                                {actionLoading[`delete-${subject.id}`] ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>לא נמצאו נושאים</p>
                            <p className="text-sm">הוסיפו נושא ראשון באמצעות הטופס למעלה</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}