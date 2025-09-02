import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqData = [
{
  question: "מה האפליקציה הזו עושה?",
  answer: "יריד הספרים הדיגיטלי של התיכון ליד האוניברסיטה היא פלטפורמה חכמה, פשוטה וחינמית להחלפה, מכירה ורכישה של ספרי לימוד בין הורים. תוכלו לפרסם למכירה ספרים שנותרו אצלכם משנים קודמות, ולחפש ספרים שאתם צריכים לשנה הבאה."
},
{
  question: "איך ניתן לדעת אילו ספרים אצטרך?",
  answer: () =>
  <>
                זה תלוי בשכבת הגיל ובקבוצות הלימוד. הרשימה המלאה מתפרסמת באתר בית הספר:
                <br />
                <a
      href="https://www.leyada.net/%d7%a8%d7%a9%d7%99%d7%9e%d7%aa-%d7%a1%d7%a4%d7%a8%d7%99-%d7%94%d7%9c%d7%99%d7%9e%d7%95%d7%93/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline font-semibold">

                    רשימת ספרי הלימוד באתר ליד״ה
                </a>
            </>

},
{
  question: "איך משיגים את הספרים שמחפשים?",
  answer: "היכנסו לקטלוג וסננו לפי שכבת לימוד.\nסמנו ספרים שאתם צריכים בלחיצה על ׳הוסף לסל׳.\nעברו ליריד והפעילו את הסנן ׳הסל שלי׳ כדי לראות מי מוכר את הספרים שבסל שלכם."
},
{
  question: "איך לפרסם ספר למכירה?",
  answer: "היכנסו לקטלוג, חפשו את הספר הרלוונטי, ולחצו ׳פרסם ביריד׳.\nעם הפרסום הראשון תתבקשו להזין פרטי קשר: בחלונית שתיפתח יש למלא את שמכם, מספר הטלפון ליצירת קשר והיישוב או השכונה כדי שהקונים יוכלו ליצור קשר ולתאם עמכם את הרכישה.\nבמודעה שלכם, תוכלו לעדכן את מצב הספר והמחיר כדי להגדיל את תיאום הציפיות מול הקונים."
},
{
  question: "הוספתי ספר לסל והוא אינו זמין ביריד",
  answer: "נסו שוב מאוחר יותר. הספרים מתעדכנים כל הזמן, אולי מישהו יפרסם את הספר שאתם מחפשים."
},
{
  question: "איך מעדכנים את מחיר ומצב הספר?",
  answer: "בקטלוג, לצד ספר שפרסמתם יופיע הכפתור ׳ערוך פרסום׳. לחיצה תפתח חלונית עם פרטי המודעה; לחצו על אייקון העפרון ליד מחיר או מצב הספר, עדכנו ולחצו ׳שמור׳."
},
{
  question: "למה מופיע לי מחיר על ספר שפירסמתי?",
  answer: "המערכת מציעה מחיר מומלץ כברירת מחדל כדי שלא יישארו מודעות ללא מחיר. תוכלו להיכנס למודעה ולעדכן את המחיר בכל רגע."
},
{
  question: "איך לעדכן פרטי קשר?",
  answer: "מומלץ לעדכן פרופיל כדי להקל על יצירת קשר. פתחו את התפריט הראשי ← ׳עריכת פרופיל׳ (אייקון גלגל שיניים) ← עדכנו שם המשתמש להצגה, מספר טלפון ומיקום (יישוב/שכונה) ← ׳שמור׳."
},
{
  question: "איך ליצור קשר עם מוכר?",
  answer: "ביריד, ליד כל מודעה:\nאם המוכר עדכן מספר טלפון ומציג אותו - תופיע אפשרות ליצור קשר בווטסאפ/טלפון.\nאם אין טלפון גלוי - תופיע אפשרות ליצירת קשר דרך אימייל."
},
{
  question: "לא מצאתי את הספר שחיפשתי",
  answer: "הקטלוג כולל את כל הספרים שהופיעו ברשימת הספרים של בית הספר לנה״ל הקרובה. אם לדעתכם חסר ספר, שלחו לנו פרטים דרך כפתור המשוב ונבדוק אם יש להוסיפו."
},
{
  question: "יש לי תקלה באפליקציה",
  answer: "נסו: רענון עמוד, פתיחה בדפדפן אחר או במכשיר אחר. אם הבעיה נמשכת - כתבו לנו דרך כפתור המשוב עם תיאור קצר (מכשיר/דפדפן/תיאור הבעיה)."
},
{
  question: "אני לא מליד״ה",
  answer: "האפליקציה מיועדת לקהילת התיכון ליד האוניברסיטה. אם תרצו לאמץ את היוזמה לבית הספר שלכם - פנו דרך כפתור המשוב וננסה לסייע."
},
{
  question: "מה לעשות אחרי שמכרתי ספר?",
  answer: "כדי להימנע מפניות נוספות: בקטלוג או ביריד הפעילו את הסנן ספרים שפירסמתי ← היכנסו לספר ← לחצו סמן כנמכר."
},
{
  question: "מה לעשות אחרי שהשגתי את הספר שחיפשתי?",
  answer: "הסירו אותו מהסל כדי להמשיך להתמקד במה שחסר לכם: בקטלוג הפעילו הסל שלי ← הסר מהסל."
},
{
  question: "למה אני לא רואה את כל הספרים?",
  answer: "כנראה מופעל סינון. לחצו נקה סינון כדי לראות את הרשימה המלאה."
},
{
  question: "מה זה מחיר מומלץ?",
  answer: "הקהילה מעודדת מחירים אחידים לטובת הוגנות, יעילות ושמירה על הסביבה. המחיר המומלץ הוא נקודת פתיחה בלבד - ניתן לערוך אותו בכל עת."
},
{
  question: "יש לכם המלצות לשיפור?",
  answer: "נשמח לשמוע! שלחו לנו דרך כפתור המשוב. כל הצעה מתקבלת בברכה."
}];


export default function FAQPage() {
  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">שאלות נפוצות</h1>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item, index) =>
            <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-right py-6 text-lg font-semibold flex flex-1 items-center justify-between transition-all [&[data-state=open]>svg]:rotate-180 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {typeof item.answer === 'function' ? item.answer() : item.answer}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
    </div>);

}