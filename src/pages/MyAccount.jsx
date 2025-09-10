import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, ShieldAlert } from "lucide-react";
import DeleteAccountConfirmationDialog from "../components/user/DeleteAccountConfirmationDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyAccountPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to fetch user:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-var(--header-height))]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] text-center text-red-500 p-4">
                <p>לא ניתן לטעון את פרטי המשתמש. אנא נסה/י להתחבר מחדש.</p>
                 <Link to={createPageUrl("BookCatalog")}>
                    <Button variant="link">חזרה לקטלוג</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div dir="rtl" className="max-w-4xl mx-auto p-4 md:p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">הגדרות חשבון</h1>
                    <p className="text-gray-500 mt-1">נהל את הגדרות החשבון והעדפות אישיות.</p>
                </header>

                <div className="grid gap-8">
                    {/* Future sections like Notification Preferences can go here */}
                    
                    <Card className="border-red-200 bg-red-50/20 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                                <CardTitle className="text-red-800">אזור סכנה</CardTitle>
                            </div>
                            <CardDescription className="text-red-700 pt-2">
                                פעולות בחלק זה הן בלתי הפיכות. יש לנהוג בזהירות.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-red-200 bg-white">
                                <div>
                                    <h3 className="font-semibold text-gray-800">מחיקת חשבון</h3>
                                    <p className="text-sm text-gray-600 mt-1 max-w-lg">
                                        פעולה זו תמחק לצמיתות את כל הנתונים שלך מהמערכת, כולל פרטי פרופיל, ספרים שפרסמת, והספרים בסל הקניות שלך.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="mt-4 sm:mt-0 w-full sm:w-auto flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    מחק את החשבון שלי
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {user && (
                <DeleteAccountConfirmationDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                    currentUser={user}
                />
            )}
        </>
    );
}