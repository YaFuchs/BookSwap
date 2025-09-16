import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, User, Mail, MapPin, Phone } from "lucide-react";

export default function ContentManagerItem({ manager, onRemove, currentUserId }) {
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = async () => {
        if (!confirm(`האם אתם בטוחים שברצונכם להסיר את ההרשאה של ${manager.display_name || manager.full_name}?`)) {
            return;
        }

        setIsRemoving(true);
        try {
            await onRemove(manager.id, manager.display_name || manager.full_name);
        } finally {
            setIsRemoving(false);
        }
    };

    const isCurrentUser = manager.id === currentUserId;
    const displayName = manager.display_name || manager.full_name || "משתמש לא ידוע";

    return (
        <Card className="transition-colors hover:bg-gray-50">
            <CardContent className="p-4">
                {/* Desktop Layout - Keep exactly as is */}
                <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
                    {/* Left side - Identity and details */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 truncate">{displayName}</span>
                                <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">מנהל תוכן</Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{manager.email}</span>
                                </div>
                                
                                {manager.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span>{manager.city}</span>
                                    </div>
                                )}
                                
                                {manager.phone_e164 && manager.show_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span>{manager.phone_e164}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side - Actions */}
                    <div className="flex-shrink-0">
                        {isCurrentUser ? (
                            <Badge variant="outline" className="text-gray-500">
                                זה אתם
                            </Badge>
                        ) : (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                                disabled={isRemoving}
                                className="flex items-center gap-2"
                            >
                                {isRemoving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3 h-3" />
                                )}
                                הסר הרשאה
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Layout - Stack into two rows */}
                <div className="flex md:hidden flex-col space-y-3">
                    {/* Row 1: Identity and details */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2 flex-wrap">
                                <span className="font-medium text-gray-900">{displayName}</span>
                                <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">מנהל תוכן</Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="break-all">{manager.email}</span>
                                </div>
                                
                                {manager.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span>{manager.city}</span>
                                    </div>
                                )}
                                
                                {manager.phone_e164 && manager.show_phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span>{manager.phone_e164}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Actions */}
                    <div className="flex justify-end">
                        {isCurrentUser ? (
                            <Badge variant="outline" className="text-gray-500">
                                זה אתם
                            </Badge>
                        ) : (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                                disabled={isRemoving}
                                className="flex items-center gap-2"
                            >
                                {isRemoving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3 h-3" />
                                )}
                                הסר הרשאה
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}