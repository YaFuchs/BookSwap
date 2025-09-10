
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@/api/entities";
import { Loader2, Info } from "lucide-react";
import { useAppNotifications } from "../hooks/useAppNotifications";

export default function ProfileEditDialog({ open, onOpenChange, currentUser, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    display_name: "",
    city: "",
    show_phone: true
  });
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  const notify = useAppNotifications();

  const isPhoneNumberComplete = phonePrefix.length === 3 && phoneNumber.length === 7;
  const isPhoneNumberEmpty = phonePrefix.length === 0 && phoneNumber.length === 0;
  const isPhoneNumberValid = isPhoneNumberComplete || isPhoneNumberEmpty;

  useEffect(() => {
    if (currentUser) {
      setFormData({
        display_name: currentUser.display_name || currentUser.full_name || "",
        city: currentUser.city || "",
        show_phone: currentUser.show_phone !== false // Default to true if undefined
      });

      // Parse E.164 phone number back to display format
      if (currentUser.phone_e164 && currentUser.phone_e164.startsWith("+972") && currentUser.phone_e164.length === 13) {
        const localPart = currentUser.phone_e164.substring(4); // remove +972
        setPhonePrefix("0" + localPart.substring(0, 2));
        setPhoneNumber(localPart.substring(2));
      } else {
        setPhonePrefix("");
        setPhoneNumber("");
      }
    }
  }, [currentUser, open]);

  useEffect(() => {
    // Check for profile completeness when dialog is open
    if (currentUser && open) {
      const isIncomplete =
      !currentUser.display_name ||
      currentUser.display_name.trim() === "" ||
      !currentUser.phone_e164 ||
      currentUser.phone_e164.trim() === "" ||
      !currentUser.city ||
      currentUser.city.trim() === "";
      setIsProfileIncomplete(isIncomplete);
    } else {
      setIsProfileIncomplete(false);
    }
  }, [currentUser, open]);


  useEffect(() => {
    // Real-time validation logic
    if (isPhoneNumberValid) {
      setPhoneError("");
    } else {
      setPhoneError("מספר הטלפון אינו שלם");
    }
  }, [phonePrefix, phoneNumber, isPhoneNumberValid]);

  const handlePrefixChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (value.length <= 3) {
      // Enforce leading '0'
      if (value.length > 0 && value.charAt(0) !== '0') {
        setPhonePrefix('0' + value.substring(0, 2));
      } else {
        setPhonePrefix(value);
      }
    }
  };

  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (value.length <= 7) {
      setPhoneNumber(value);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, show_phone: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // When submitting, if fields are empty, we want to ensure the red borders appear.
    // The isProfileIncomplete state is only set on open, so we re-evaluate here for the submit action.
    if (!formData.display_name.trim() || !formData.city.trim() || (!isPhoneNumberComplete && !isPhoneNumberEmpty)) {
      setIsProfileIncomplete(true);
    }

    if (!formData.display_name || !isPhoneNumberValid || loading) return;

    setLoading(true);
    let finalPhoneE164 = "";
    if (isPhoneNumberComplete) {
      const localNumber = phonePrefix.substring(1) + phoneNumber;
      finalPhoneE164 = `+972${localNumber}`;
    }

    try {
      await User.updateMyUserData({
        ...formData,
        phone_e164: finalPhoneE164
      });
      notify.success("הפרופיל עודכן!", "השינויים נשמרו בהצלחה.");
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      notify.error("שגיאה בעדכון הפרופיל", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-right">
                    <DialogTitle>עריכת פרופיל</DialogTitle>
                    <DialogDescription>
                        עדכנו את הפרטים שלכם. השינויים יוצגו לשאר המשתמשים.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {isProfileIncomplete &&
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2 shadow-sm">
                           <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                           <span>עדכנו פרטי קשר ומיקום כדי שקונים מהאזור ימצאו אתכם מהר.</span>
                        </div>
          }
                    <div className="text-right">
                        <Label htmlFor="display_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">שם משתמש לתצוגה (חובה)</Label>
                        <Input
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              required
              className={`text-right ${isProfileIncomplete && !formData.display_name.trim() ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />

                    </div>
                    <div className="text-right">
                        <Label htmlFor="phonePrefix">מספר טלפון (WhatsApp)</Label>
                        <div dir="ltr" className="flex items-center gap-2 mt-1">
                            <Input
                id="phonePrefix"
                name="phonePrefix"
                placeholder="0 _ _"
                value={phonePrefix}
                onChange={handlePrefixChange}
                maxLength={3}
                className={`w-20 text-left tracking-wider ${phoneError && !isPhoneNumberEmpty || isProfileIncomplete && isPhoneNumberEmpty ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />

                            <span className="text-gray-500 font-semibold">-</span>
                            <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="_ _ _ _ _ _ _"
                value={phoneNumber}
                onChange={handleNumberChange}
                maxLength={7}
                className={`w-36 text-left tracking-wider ${phoneError && !isPhoneNumberEmpty || isProfileIncomplete && isPhoneNumberEmpty ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />

                        </div>
                        {phoneError && !isPhoneNumberEmpty &&
            <p className="text-red-500 text-xs mt-1 text-right">{phoneError}</p>
            }
                        {isPhoneNumberComplete &&
            <p className="text-xs text-green-600 mt-1 text-right">
                                יישמר כ: +972{phonePrefix.substring(1)}{phoneNumber}
                            </p>
            }
                         <p className="text-xs text-gray-500 mt-1 text-right">הזינו מספר ישראלי (לדוגמה: 050-1234567)</p>
                    </div>
                    <div className="text-right">
                        <Label htmlFor="city" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ישוב/שכונה</Label>
                        <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`text-right ${isProfileIncomplete && !formData.city.trim() ? 'border-red-400 focus-visible:ring-red-400' : ''}`} />

                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse justify-end">
                        <Checkbox
              id="show_phone"
              checked={formData.show_phone}
              onCheckedChange={handleCheckboxChange} />

                        <Label htmlFor="show_phone" className="cursor-pointer">
                            להציג את מספר הטלפון שלי במודעות
                        </Label>
                    </div>
                    {!formData.show_phone &&
          <p className="text-red-600 text-sm text-right mt-1">
                            טלפון מוסתר = פחות פניות מקונים.
                        </p>
          }
                    <DialogFooter>
                        <div className="flex gap-2 w-full justify-end">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>ביטול</Button>
                            <Button type="submit" disabled={!formData.display_name || loading || !isPhoneNumberValid}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                שמירה
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>);
}
