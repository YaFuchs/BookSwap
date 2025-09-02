
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MapPin, Eye, EyeOff, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ListingDetailsModal from "./ListingDetailsModal";
import ContactButtons from "../shared/ContactButtons";
import { formatPrice } from "../utils/formatPrice";

export default function SellerGroupList({ 
    groupedResults, 
    GRADES, 
    user, 
    showMyBooksOnly, 
    onAddNewListingClick, 
    onFullDataRefresh, 
    onGranularUpdate, 
    onProfileNudgeClick 
}) {
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [myListingsFilter, setMyListingsFilter] = useState('available'); // 'available' or 'sold'

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {groupedResults.map((group, index) => {
                    const isCurrentUserGroup = group.seller.id === user?.id;
                    const isProfileIncompleteForCurrentUser = isCurrentUserGroup && (
                        !user?.display_name || user.display_name.trim() === '' ||
                        !user?.phone_e164 || user.phone_e164.trim() === '' ||
                        !user?.city || user.city.trim() === '' ||
                        user?.show_phone === false
                    );

                    return (
                        <motion.div 
                            key={group.seller.id} 
                            className="w-full overflow-hidden"
                            layout 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1, transition: { delay: index * 0.1 } }} 
                            exit={{ opacity: 0 }}
                        >
                            <Card className="shadow-lg border-0 overflow-hidden">
                                <div className="bg-white p-4 border-b">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {group.seller.display_name?.charAt(0) || group.seller.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{group.seller.display_name || group.seller.full_name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    {group.seller.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.seller.city}</span>}
                                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{group.matchCount} ספרים זמינים</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 items-center">
                                            {showMyBooksOnly && group.seller.id === user?.id ? (
                                                <>
                                                    {/* Segmented Control for "זמינים" and "נמכרו" - HIDDEN ON MOBILE */}
                                                    <div className="hidden sm:flex rounded-md shadow-sm">
                                                        <Button
                                                            variant={myListingsFilter === 'sold' ? 'default' : 'outline'}
                                                            onClick={() => setMyListingsFilter('sold')}
                                                            className="rounded-l-none flex items-center gap-2"
                                                            size="sm"
                                                        >
                                                            <EyeOff className="w-4 h-4" />
                                                            נמסרו ({group.listings.filter(l => l.status === 'sold').length})
                                                        </Button>
                                                        <Button
                                                            variant={myListingsFilter === 'available' ? 'default' : 'outline'}
                                                            onClick={() => setMyListingsFilter('available')}
                                                            className="rounded-r-none border-r-0 flex items-center gap-2"
                                                            size="sm"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            זמינים ({group.listings.filter(l => l.status === 'available').length})
                                                        </Button>
                                                    </div>
                                                    <Button onClick={onAddNewListingClick} className="bg-blue-600 hover:bg-blue-700">
                                                        הוסף ספר לפרסום
                                                    </Button>
                                                </>
                                            ) : (
                                                <ContactButtons seller={group.seller} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Profile Completeness Nudge */}
                                    {isProfileIncompleteForCurrentUser && (
                                        <div className="mt-3 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2 shadow-sm">
                                            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <span>השלימו את פרטי הפרופיל שלכם כדי שקונים מהאזור ימצאו אתכם מהר ויוכלו ליצור איתכם קשר בקלות.</span>
                                                <Button 
                                                    onClick={onProfileNudgeClick}
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 bg-white hover:bg-red-50 border-red-300 text-red-700"
                                                >
                                                    השלמת פרטים
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-4 bg-gray-50/50">
                                    <div className="flex flex-nowrap gap-4 overflow-x-auto py-2">
                                        {(() => {
                                            const listingsToRender = (showMyBooksOnly && group.seller.id === user?.id)
                                                ? group.listings.filter(l => l.status === myListingsFilter)
                                                : group.listings.filter(l => l.status === 'available'); // For other sellers, ONLY show available books.

                                            // Show empty state for current user when they have no books matching the filter
                                            if (listingsToRender.length === 0 && showMyBooksOnly && group.seller.id === user?.id) {
                                                return (
                                                    <div className="w-full flex items-center justify-center py-8">
                                                        <div className="text-center text-gray-500">
                                                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-sm">
                                                                {myListingsFilter === 'available' ? 'אין ספרים זמינים' : 'אין ספרים שנמסרו'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return listingsToRender.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(listing => (
                                                <div 
                                                    key={listing.id} 
                                                    className="w-48 flex-shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                                    onClick={() => {
                                                        const isCurrentUserListing = (group.seller.id === user?.id);
                                                        setSelectedListing({...listing, seller: group.seller, isCurrentUserListing: isCurrentUserListing});
                                                        setIsListingModalOpen(true);
                                                    }}
                                                >
                                                    {/* Book Cover Image with Price Overlay */}
                                                    <div className="relative">
                                                        {listing.book.cover_image_url ? (
                                                            <img 
                                                                src={listing.book.cover_image_url} 
                                                                alt={listing.book.title_he} 
                                                                className="w-full h-32 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                                                <BookOpen className="w-12 h-12 text-gray-400" />
                                                            </div>
                                                        )}
                                                        {/* Price Overlay */}
                                                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-md z-5">
                                                            {formatPrice(listing.price_agorot)}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Card Content */}
                                                    <div className="p-3 flex flex-col justify-between flex-grow">
                                                        <div className="flex-grow">
                                                            {/* Book Title */}
                                                            <h4 className="text-base font-semibold text-gray-900 mb-1">{listing.book.title_he}</h4>
                                                            
                                                            {/* Book Subject as subtitle */}
                                                            {listing.book.subject && (
                                                                <p className="text-sm text-gray-600 mb-2">{listing.book.subject}</p>
                                                            )}
                                                            
                                                            {/* Badges including removed from catalog */}
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {/* Removed from catalog badge */}
                                                                {listing.book.status === 'removed_from_catalog' && (
                                                                    <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap">
                                                                        הוסר מקטלוג הספרים
                                                                    </Badge>
                                                                )}
                                                                
                                                                {/* Grade badges */}
                                                                {listing.book.grade_numbers && (() => {
                                                                    const grades = listing.book.grade_numbers;
                                                                    if (grades.length > 2) {
                                                                        // Show only first and last grade
                                                                        const firstGrade = GRADES.find(g => g.id === grades[0]);
                                                                        const lastGrade = GRADES.find(g => g.id === grades[grades.length - 1]);
                                                                        return (
                                                                            <>
                                                                                {firstGrade && (
                                                                                    <Badge variant="secondary" className="whitespace-nowrap text-xs">
                                                                                        {firstGrade.name}
                                                                                    </Badge>
                                                                                )}
                                                                                {lastGrade && firstGrade.id !== lastGrade.id && (
                                                                                    <Badge variant="secondary" className="whitespace-nowrap text-xs">
                                                                                        {lastGrade.name}
                                                                                    </Badge>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    } else {
                                                                    // Show all grades (2 or less)
                                                                        return grades.map(gradeNum => {
                                                                            const grade = GRADES.find(g => g.id === gradeNum);
                                                                            return grade ? (
                                                                                <Badge key={gradeNum} variant="secondary" className="whitespace-nowrap text-xs">
                                                                                    {grade.name}
                                                                                </Badge>
                                                                            ) : null;
                                                                        });
                                                                    }
                                                                })()}
                                                            </div>
                                                            
                                                            {/* Condition Note */}
                                                            {listing.condition_note && (
                                                                <p className="text-sm text-gray-600 line-clamp-2">מצב: {listing.condition_note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            
            <ListingDetailsModal
                open={isListingModalOpen}
                onOpenChange={setIsListingModalOpen}
                listing={selectedListing}
                GRADES={GRADES}
                user={user}
                onListingUpdate={onFullDataRefresh}
                onGranularUpdate={onGranularUpdate}
            />
        </div>
    );
}
