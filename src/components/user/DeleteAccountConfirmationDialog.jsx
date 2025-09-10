
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/api/entities';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAppNotifications } from '@/components/hooks/useAppNotifications';
import { createPageUrl } from '@/utils'; // This import is no longer strictly needed for this specific URL but is kept as it might be used elsewhere or for consistency.
import { deleteMyAccount } from '@/api/functions';

export default function DeleteAccountConfirmationDialog({ open, onOpenChange, currentUser }) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notify = useAppNotifications();

  useEffect(() => {
    if (open) {
      setConfirmationInput('');
      setLoading(false);
      setError('');
    }
  }, [open]);

  const handleConfirmDelete = async () => {
    if (!currentUser || confirmationInput.toLowerCase() !== currentUser.email.toLowerCase()) {
      setError('אימות כתובת המייל נכשל. אנא וודאו שכתובת המייל תואמת.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await deleteMyAccount();

      if (response.status === 200) {
        notify.success('חשבון נמחק!', 'חשבונכם וכל הנתונים המשויכים אליו נמחקו לצמיתות.');
        await User.logout();
        window.location.href = 'https://-37dc6bbe.base44.app/Goodbye'; // Updated line
      } else {
        const responseData = await response.json().catch(() => ({}));
        setError(responseData?.error || 'אירעה שגיאה במחיקת החשבון.');
        notify.error('שגיאה במחיקת חשבון', responseData?.error || 'נסו שוב מאוחר יותר.');
      }

    } catch (err) {
      console.error('Error during account deletion:', err);
      const errorMessage = err.response?.data?.error || err.message || 'אירעה שגיאה בלתי צפויה במחיקת החשבון.';
      setError(errorMessage);
      notify.error('שגיאה במחיקת חשבון', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle>מחיקת חשבון</DialogTitle>
          <DialogDescription className="text-right">
            פעולה זו מוחקת לצמיתות את החשבון וכל הפרסומים והספרים המשויכים אליו. פעולה זאת לא ניתנת לשחזור.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-right">
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
              אנא אשרו על ידי הקלדת כתובת המייל שלכם (<code>{currentUser?.email}</code>) בשדה למטה:
            </span>
          </div>

          <div>
            <Label htmlFor="email-confirmation" className="sr-only">אימות כתובת המייל</Label>
            <Input
              id="email-confirmation"
              type="email"
              placeholder={currentUser?.email}
              value={confirmationInput}
              onChange={(e) => {
                setConfirmationInput(e.target.value);
                setError('');
              }}
              className="text-right"
              disabled={loading}
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 sm:space-x-reverse">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ביטול
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={loading || confirmationInput.toLowerCase() !== currentUser?.email.toLowerCase()}
          >
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            מחק חשבון לצמיתות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
