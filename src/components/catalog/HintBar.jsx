
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Info, Loader2, Store, Library, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Hebrew grammar helpers
const heSellersFragment = (n) => {
  if (n === 0) return "";
  if (n === 1) return " אצל מוכר אחד";
  if (n === 2) return " אצל שני מוכרים";
  return ` אצל ${n} מוכרים`;
};

const heUserBasketLabel = (n) => {
  if (n === 1) return "הספר";
  if (n === 2) return "שני הספרים";
  return `${n} הספרים`;
};

const heAvailableWord = (count) => {
  return count === 1 ? "זמין" : "זמינים";
};

const heUnavailableWord = (count) => {
  return count === 1 ? "אינו זמין" : "אינם זמינים";
};

export default function HintBar({ user, userListingsCount, userBasketCount, basketAvailabilitySummary, loadingSummary, pageType = 'catalog', isMyBasketFilterActive = false }) {
  if (!user) return null;

  let hintContent = null;
  let showCta = false;
  let ctaText = '';
  let ctaLink = '';
  let ctaIcon = null;
  let ctaClassName = "bg-green-600 hover:bg-green-700"; // Default for "Go to Fair"

  const bookFairLink = <Link to={createPageUrl('BookFair')} className="font-bold underline hover:text-blue-700">ביריד</Link>;
  const bookCatalogLink = <Link to={createPageUrl('BookCatalog')} className="font-bold underline hover:text-blue-700">לקטלוג</Link>;

  if (userBasketCount === 0) {
    if (pageType === 'fair') {
      hintContent = <span>הסל שלכם ריק. עברו {bookCatalogLink} והוסיפו ספרים שאתם צריכים.</span>;
      showCta = true;
      ctaText = 'עבור לקטלוג';
      ctaLink = createPageUrl('BookCatalog');
      ctaIcon = <Library className="w-3 h-3" />;
      ctaClassName = "bg-blue-600 hover:bg-blue-700"; // Blue for "Go to Catalog"
    } else { // 'catalog' page logic
        if (userListingsCount === 0) {
            hintContent = <span>פרסמו ספרים שברשותכם למכירה, או הוסיפו לסל את הספרים שאתם צריכים.</span>;
        } else {
            hintContent = <span>הוסיפו לסל את הספרים שאתם צריכים כדי לראות מי מוכר אותם {bookFairLink}</span>;
        }
    }
  } else { // userBasketCount > 0
    if (loadingSummary) {
      hintContent = <Loader2 className="w-4 h-4 animate-spin" />;
    } else {
      const { availableBooksCount, uniqueSellersCount } = basketAvailabilitySummary;
      
      // Message logic - different for Fair vs Catalog pages
      if (pageType === 'fair') {
        // Fair page specific messages
        if (availableBooksCount === 0) {
          hintContent = (<span>כרגע אין מוכרים לספרים שאתם מחפשים. גשו {bookCatalogLink} והוסיפו ספרים אחרים לסל.</span>);
        } else if (availableBooksCount === userBasketCount) {
          hintContent = (<span>{heUserBasketLabel(userBasketCount)} שהוספתם לסל {heAvailableWord(userBasketCount)}{heSellersFragment(uniqueSellersCount)}.</span>);
        } else {
          hintContent = (<span>{availableBooksCount} מתוך {heUserBasketLabel(userBasketCount)} שבסל {heAvailableWord(availableBooksCount)} למכירה{heSellersFragment(uniqueSellersCount)}.</span>);
        }
      } else {
        // Catalog page messages (original logic)
        if (availableBooksCount === 0) {
          hintContent = (<span>{heUserBasketLabel(userBasketCount)} שהוספתם לסל {heUnavailableWord(userBasketCount)} כעת ביריד. נסו מאוחר יותר או הוסיפו ספרים אחרים לסל.</span>);
        } else if (availableBooksCount === userBasketCount) {
          hintContent = (<span>{heUserBasketLabel(userBasketCount)} שהוספתם לסל {heAvailableWord(userBasketCount)} ביריד{heSellersFragment(uniqueSellersCount)}.</span>);
        } else {
          hintContent = (<span>ביריד תמצאו {availableBooksCount} מתוך {heUserBasketLabel(userBasketCount)} שבסל {heAvailableWord(availableBooksCount)} למכירה{heSellersFragment(uniqueSellersCount)}.</span>);
        }
      }

      // CTA Logic depends on pageType
      if (pageType === 'fair') {
        if (availableBooksCount === 0) {
          showCta = true;
          ctaText = 'עבור לקטלוג';
          ctaLink = createPageUrl('BookCatalog');
          ctaIcon = <Library className="w-3 h-3" />;
          ctaClassName = "bg-blue-600 hover:bg-blue-700";
        } else if (availableBooksCount > 0 && !isMyBasketFilterActive) {
          showCta = true;
          ctaText = 'עבור לסל שלי';
          ctaLink = null; // This will be handled by custom event
          ctaIcon = <ShoppingCart className="w-3 h-3" />;
          ctaClassName = "bg-orange-500 hover:bg-orange-600";
        }
        // No CTA for other cases in 'fair' (i.e., when availableBooksCount > 0 and isMyBasketFilterActive is true, or no special CTA needed)
      } else { // 'catalog' page logic
        if (availableBooksCount > 0) {
          showCta = true;
          ctaText = 'עבור ליריד';
          ctaLink = createPageUrl('BookFair');
          ctaIcon = <Store className="w-3 h-3" />;
          // ctaClassName remains green (default)
        }
      }
    }
  }

  // Do not render the bar if there's no content to display
  if (hintContent === null) {
    return null;
  }

  // Determine background color: Orange for empty basket OR basket with no available books
  const shouldUseOrangeBackground = userBasketCount === 0 || 
    (userBasketCount > 0 && !loadingSummary && basketAvailabilitySummary.availableBooksCount === 0);

  const handleMyBasketClick = () => {
    document.dispatchEvent(new CustomEvent('activate-my-basket-filter'));
  };

  return (
    <div className={`px-4 py-2 w-full md:px-6 ${shouldUseOrangeBackground ? 'bg-orange-50' : 'bg-lime-50'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-center text-sm text-gray-700">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        {hintContent}
        {showCta && (
          <>
            {ctaLink ? (
              <Link to={ctaLink}>
                <Button size="sm" className={`${ctaClassName} h-7 text-xs px-3 shadow-sm font-bold flex items-center gap-1`}>
                  {ctaIcon}
                  {ctaText}
                </Button>
              </Link>
            ) : (
              <Button 
                size="sm" 
                className={`${ctaClassName} h-7 text-xs px-3 shadow-sm font-bold flex items-center gap-1`}
                onClick={handleMyBasketClick}
              >
                {ctaIcon}
                {ctaText}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
