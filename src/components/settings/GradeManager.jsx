
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RotateCcw, GraduationCap } from "lucide-react";
import { useGrades } from "../hooks/useGrades";
import { updateGrade } from "@/api/functions";
import { useAppNotifications } from "../hooks/useAppNotifications";

export default function GradeManager() {
    const { grades, loading, error, refetch } = useGrades(true);
    const [editedGrades, setEditedGrades] = useState({});
    const [savingGrades, setSavingGrades] = useState({});
    const [switchLoading, setSwitchLoading] = useState({}); // New state for Switch loading
    const notify = useAppNotifications();

    const handleFieldChange = (gradeId, field, value) => {
        setEditedGrades(prev => ({
            ...prev,
            [gradeId]: {
                ...prev[gradeId],
                [field]: value
            }
        }));
    };

    // New function to check if only label has changes (not active state)
    const hasLabelChanges = (grade) => {
        const edits = editedGrades[grade.id];
        if (!edits) return false;
        
        return (edits.label !== undefined && edits.label !== grade.label);
    };

    const getDisplayValue = (grade, field) => {
        const edits = editedGrades[grade.id];
        if (edits && edits[field] !== undefined) {
            return edits[field];
        }
        return grade[field];
    };

    // New auto-save handler for Switch toggle
    const handleSwitchToggle = async (grade, newActiveState) => {
        setSwitchLoading(prev => ({ ...prev, [grade.id]: true }));

        // Optimistic UI update
        setEditedGrades(prev => ({
            ...prev,
            [grade.id]: {
                ...prev[grade.id],
                active: newActiveState
            }
        }));

        try {
            await updateGrade({
                gradeId: grade.id,
                updateData: { active: newActiveState }
            });

            notify.success("שכבה עודכנה!", `${grade.label} ${newActiveState ? 'הופעלה' : 'הושבתה'} בהצלחה.`);
            
            // Clear any active state edits for this grade, but keep label edits
            setEditedGrades(prev => {
                const newState = { ...prev };
                if (newState[grade.id]) {
                    delete newState[grade.id].active;
                    // If no other edits remain, remove the grade entry entirely
                    if (Object.keys(newState[grade.id]).length === 0) {
                        delete newState[grade.id];
                    }
                }
                return newState;
            });

            // Refresh the grades list
            await refetch();
        } catch (error) {
            console.error("Error updating grade active state:", error);
            
            // Revert the optimistic update on failure
            setEditedGrades(prev => {
                const newState = { ...prev };
                if (newState[grade.id]) {
                    // Revert to original active state
                    newState[grade.id].active = !newActiveState; 
                    if (Object.keys(newState[grade.id]).length === 0) {
                        delete newState[grade.id];
                    }
                }
                return newState;
            });
            
            notify.error("שגיאה בעדכון", `לא ניתן לעדכן את ${grade.label}: ${error.message}`);
        } finally {
            setSwitchLoading(prev => ({ ...prev, [grade.id]: false }));
        }
    };

    // Updated save handler - now only for label changes
    const handleSave = async (grade) => {
        const edits = editedGrades[grade.id];
        if (!edits || !hasLabelChanges(grade)) return;

        setSavingGrades(prev => ({ ...prev, [grade.id]: true }));

        try {
            // Only send label changes
            const updateData = {};
            if (edits.label !== undefined) {
                updateData.label = edits.label;
            }

            await updateGrade({
                gradeId: grade.id,
                updateData
            });

            notify.success("שכבה עודכנה!", `השינויים נשמרו בהצלחה עבור ${grade.label}.`);
            
            // Clear only the label edits for this grade
            setEditedGrades(prev => {
                const newState = { ...prev };
                if (newState[grade.id]) {
                    delete newState[grade.id].label;
                    // If no other edits remain, remove the grade entry entirely
                    if (Object.keys(newState[grade.id]).length === 0) {
                        delete newState[grade.id];
                    }
                }
                return newState;
            });

            // Refresh the grades list
            await refetch();
        } catch (error) {
            console.error("Error updating grade label:", error);
            notify.error("שגיאה בעדכון", `לא ניתן לעדכן את ${grade.label}: ${error.message}`);
        } finally {
            setSavingGrades(prev => ({ ...prev, [grade.id]: false }));
        }
    };

    const handleRevert = (gradeId) => {
        setEditedGrades(prev => {
            const newState = { ...prev };
            // Only revert label changes, keep any active state changes
            if (newState[gradeId]) {
                delete newState[gradeId].label;
                // If no other edits remain, remove the grade entry entirely
                if (Object.keys(newState[gradeId]).length === 0) {
                    delete newState[gradeId];
                }
            }
            return newState;
        });
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="mr-2 text-gray-600">טוען שכבות...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        <p>שגיאה בטעינת השכבות: {error.message}</p>
                        <Button 
                            variant="outline" 
                            onClick={() => refetch()} 
                            className="mt-2"
                        >
                            נסה שוב
                        </Button>
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
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                        <CardTitle>ניהול שכבות לימוד</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {grades.length} שכבות
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                    ניהול שכבות הלימוד הזמינות במערכת. ניתן לערוך את תווית השכבות ולהפעיל/להשבית שכבות.
                </div>

                <div className="space-y-3">
                    {grades.map(grade => {
                        const hasLabelEdits = hasLabelChanges(grade);
                        const isSavingLabel = savingGrades[grade.id];
                        const isSwitchLoading = switchLoading[grade.id];
                        const isActive = getDisplayValue(grade, 'active');
                        
                        return (
                            <div key={grade.id}>
                                {/* Desktop Layout - Keep exactly as is */}
                                <div className="hidden md:grid md:grid-cols-[1fr_120px] md:gap-3 md:min-h-[72px]">
                                    {/* Col A: Main Card */}
                                    <Card className={`transition-colors ${
                                        hasLabelEdits && isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                                    }`}>
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-[56px_1fr_48px_96px] gap-4 items-center min-h-[40px]">
                                                {/* Grade Number - Fixed Width */}
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700 justify-self-center">
                                                    {grade.grade_number}
                                                </div>
                                                
                                                {/* Label Input - Flexible */}
                                                <Input
                                                    value={getDisplayValue(grade, 'label')}
                                                    onChange={(e) => handleFieldChange(grade.id, 'label', e.target.value)}
                                                    disabled={isSavingLabel || !isActive}
                                                    className="w-full"
                                                />

                                                {/* Switch - Fixed Width */}
                                                <div className="flex justify-center">
                                                    {isSwitchLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                    ) : (
                                                        <Switch
                                                            id={`grade-${grade.id}-active`}
                                                            checked={isActive}
                                                            onCheckedChange={(checked) => handleSwitchToggle(grade, checked)}
                                                            disabled={isSwitchLoading}
                                                        />
                                                    )}
                                                </div>

                                                {/* Badge - Fixed Width with min-width */}
                                                <div className="flex justify-center">
                                                    {isActive ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 min-w-[80px] justify-center">
                                                            פעילה
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 min-w-[80px] justify-center">
                                                            לא פעילה
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Col B: Actions - Fixed Width */}
                                    <div className="flex items-center justify-center w-[120px]">
                                        {hasLabelEdits && isActive && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRevert(grade.id)}
                                                    disabled={isSavingLabel}
                                                    className="p-2"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(grade)}
                                                    disabled={isSavingLabel}
                                                    className="p-2"
                                                >
                                                    {isSavingLabel ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Save className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Layout */}
                                <div className="grid md:hidden">
                                    <Card className={`transition-colors ${
                                        hasLabelEdits && isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                                    }`}>
                                        <CardContent className="p-4 space-y-3">
                                            {/* Row 1: Grade Number + Label */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700 text-sm flex-shrink-0">
                                                    {grade.grade_number}
                                                </div>
                                                <Input
                                                    value={getDisplayValue(grade, 'label')}
                                                    onChange={(e) => handleFieldChange(grade.id, 'label', e.target.value)}
                                                    disabled={isSavingLabel || !isActive}
                                                    className="flex-1"
                                                />
                                            </div>

                                            {/* Row 2: Switch + Actions */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {isSwitchLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                    ) : (
                                                        <Switch
                                                            id={`grade-${grade.id}-active-mobile`}
                                                            checked={isActive}
                                                            onCheckedChange={(checked) => handleSwitchToggle(grade, checked)}
                                                            disabled={isSwitchLoading}
                                                        />
                                                    )}
                                                </div>

                                                {/* Actions - only show when there are pending label edits */}
                                                {hasLabelEdits && isActive && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRevert(grade.id)}
                                                            disabled={isSavingLabel}
                                                            className="h-8 px-3"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1" />
                                                            ביטול
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSave(grade)}
                                                            disabled={isSavingLabel}
                                                            className="h-8 px-3"
                                                        >
                                                            {isSavingLabel ? (
                                                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                            ) : (
                                                                <Save className="w-3 h-3 mr-1" />
                                                            )}
                                                            שמירה
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {grades.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>לא נמצאו שכבות במערכת</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

