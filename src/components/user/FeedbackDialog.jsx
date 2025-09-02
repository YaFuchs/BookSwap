
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { SendEmail } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";

export default function FeedbackDialog({ open, onOpenChange, currentUser }) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!feedback.trim()) {
            toast({
                title: "שדה ריק",
                description: "אנא מלאו את תוכן המשוב.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        
        try {
            const userName = currentUser?.display_name || currentUser?.full_name || "Anonymous";
            const userEmail = currentUser?.email || "Anonymous";
            
            const subject = `משוב חדש מ-BookSwap מאת: ${userEmail}`;
            
            const emailBody = `
                <h2>משוב חדש מ-BookSwap</h2>
                <p><strong>משתמש:</strong> ${userName} (${userEmail})</p>
                <hr />
                <h3>תוכן המשוב:</h3>
                <p style="white-space: pre-wrap;">${feedback}</p>
            `;

            await SendEmail({
                to: "yair.fuchs@gmail.com",
                from_name: "BookSwap Feedback",
                subject: subject,
                body: emailBody
            });

            toast({
                title: "תודה!",
                description: "המשוב שלך נשלח בהצלחה.",
                className: "bg-green-100 text-green-800",
            });

            setFeedback("");
            onOpenChange(false);

        } catch (error) {
            console.error("Error sending feedback:", error);
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בשליחת המשוב. אנא נסו שוב מאוחר יותר.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-right">
                    <DialogTitle>שליחת משוב</DialogTitle>
                    <DialogDescription>
                        נשמח לשמוע מה דעתכם! המשוב שלכם עוזר לנו להשתפר.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="text-right">
                        <Label htmlFor="feedback">המשוב שלכם</Label>
                        <Textarea
                            id="feedback"
                            placeholder="כתבו כאן את המשוב שלכם..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={6}
                            required
                            className="text-right mt-2"
                            disabled={loading}
                        />
                    </div>
                    <DialogFooter className="flex gap-2 justify-start">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            ביטול
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!feedback.trim() || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            שליחה
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
