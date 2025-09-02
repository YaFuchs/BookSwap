import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

export default function ContactButtons({ seller, bookTitle = "" }) {
  const { toast } = useToast();

  const handleWhatsApp = () => {
    const message = bookTitle 
      ? `היי, מצאתי ב-BookSwap את הספר *${bookTitle}* ואשמח לקנות אותו.`
      : `היי, ראיתי את הספרים שלך ב-BookSwap ואני מעוניין/ת.`;
    window.open(`https://api.whatsapp.com/send?phone=${seller.phone_e164}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = `BookSwap - מעוניין/ת בספר ${bookTitle}`;
    const body = `שלום, ראיתי את המודעה שלך ביריד הספרים הדיגיטלי ואני מעוניין/ת בספר ${bookTitle}.`;
    window.open(`mailto:${seller.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleGmailCompose = () => {
    const subject = `BookSwap - מעוניין/ת בספר ${bookTitle}`;
    const body = `שלום, ראיתי את המודעה שלך ביריד הספרים הדיגיטלי ואני מעוניין/ת בספר ${bookTitle}.`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${seller.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(seller.email)
      .then(() => {
        toast({
          description: "הועתק ללוח!",
          className: "bg-green-100 text-green-800",
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          description: "לא ניתן להעתיק, נסו ידנית.",
          variant: "destructive",
        });
      });
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(seller.phone_e164)
      .then(() => {
        toast({
          description: "מספר הטלפון הועתק!",
          className: "bg-green-100 text-green-800",
        });
      })
      .catch(err => {
        console.error('Failed to copy phone number: ', err);
        toast({
          description: "לא ניתן להעתיק, נסו ידנית.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="flex gap-2 shrink-0">
      {seller.phone_e164 && seller.show_phone && (
        <DropdownMenu dir="rtl">
          <div className="flex">
            <Button size="sm" onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 rounded-l-none">
              <MessageCircle className="w-4 h-4 ml-1" /> WhatsApp
            </Button>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-r-none px-2 border-l border-green-600">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleWhatsApp}>
              שלח WhatsApp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyPhone}>
              העתקת מספר טלפון
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <DropdownMenu dir="rtl">
        <div className="flex">
          <Button size="sm" variant="outline" onClick={handleEmail} className="rounded-l-none border-r-0">
            <Mail className="w-4 h-4 ml-1" /> אימייל
          </Button>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-r-none px-2">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEmail}>
            שליחת אימייל
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGmailCompose}>
            פתח ב‑Gmail
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyEmail}>
            העתקת אימייל
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}