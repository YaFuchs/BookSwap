import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BookDetailsModal from "../catalog/BookDetailsModal";
import { createPageUrl } from "@/utils";

export default function AddBookSection({ user, dynamicGrades }) {
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const navigate = useNavigate();

    const handleBookAdded = () => {
        // After a book is successfully added, close the modal
        // and redirect to the catalog with a success flag.
        setShowAddBookModal(false);
        navigate(createPageUrl("BookCatalog?source=add_book_success"));
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>ניהול קטלוג הספרים</CardTitle>
                    <CardDescription>
                        הוספת ספרים חדשים לקטלוג. ספרים חדשים יהיו זמינים לכל המשתמשים לפרסום ביריד.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => setShowAddBookModal(true)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף ספר חדש לקטלוג
                    </Button>
                </CardContent>
            </Card>

            <BookDetailsModal
                book={null}
                open={showAddBookModal}
                onOpenChange={setShowAddBookModal}
                GRADES={dynamicGrades}
                user={user}
                modalAction="add"
                onBookUpdated={handleBookAdded}
                onBookDeleted={() => {}}
                onBookPublished={() => {}}
                onBookCatalogDataChange={() => {}}
                availableCounts={{}}
                isBookInBasket={false}
                basketActionLoading={false}
                onAddToBasket={() => {}}
                onRemoveFromBasket={() => {}}
            />
        </>
    );
}