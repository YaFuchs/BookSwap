import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UnavailableBookAddedDialog({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader className="text-right">
                    <DialogTitle>נוסף לסל!</DialogTitle>
                    <DialogDescription className="text-right">
                        הספר אינו זמין כעת ביריד. בדקו שוב מאוחר יותר או הוסיפו ספרים אחרים לסל.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} className="w-full">הבנתי</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}