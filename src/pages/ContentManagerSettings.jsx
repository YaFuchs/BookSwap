import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Loader2, ShieldX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookDetailsModal from "../components/catalog/BookDetailsModal";
import { GRADES } from "../components/constants/grades";

export default function ContentManagerSettings() {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [user, setUser] = useState(null);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                if (currentUser && currentUser.is_content_manager) {
                    setIsAuthorized(true);
                } else {
                    // Redirect non-content-managers away
                    navigate(createPageUrl("BookFair"));
                }
            } catch (error) {
                // The AuthWrapper in Layout.js handles logged-out users,
                // but this is an extra layer of security.
                navigate(createPageUrl("Landing"));
            } finally {
                setLoading(false);
            }
        };

        checkAuthorization();
    }, [navigate]);

    const handleBookAdded = () => {
        // After a book is successfully added, close the modal
        // and redirect to the catalog with a success flag.
        setShowAddBookModal(false);
        navigate(createPageUrl("BookCatalog?source=add_book_success"));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!isAuthorized) {
        // This is a fallback UI in case the redirect is slow.
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 text-red-700">
                <ShieldX className="w-16 h-16 mb-4" />
                <h1 className="text-2xl font-bold">גישה נדחתה</h1>
                <p>אין לך הרשאה לצפות בדף זה.</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 md:p-10" dir="rtl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">הגדרות ניהול תוכן</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>ניהול קטלוג הספרים</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            מנהלי תוכן יכולים להוסיף ספרים לקטלוג הספרים ע״י לחיצה על הכפתור ״ספר חדש״
                        </p>
                        <Button onClick={() => setShowAddBookModal(true)}>
                            <Plus className="ml-2 h-4 w-4" />
                            ספר חדש
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <BookDetailsModal
                book={null} // We are adding a new book, so no initial book data
                open={showAddBookModal}
                onOpenChange={setShowAddBookModal}
                GRADES={GRADES}
                user={user}
                onBookDeleted={handleBookAdded} // Re-using this prop for success callback
                modalAction="add"
            />
        </>
    );
}