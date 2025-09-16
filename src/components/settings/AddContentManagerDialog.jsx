import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, User, Mail, MapPin, Phone, Loader2 } from "lucide-react";

export default function AddContentManagerDialog({ 
    open, 
    onOpenChange, 
    allUsers, 
    contentManagers, 
    onAdd 
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    // Get list of users who are NOT already content managers
    const eligibleUsers = useMemo(() => {
        const managerIds = new Set(contentManagers.map(m => m.id));
        return allUsers.filter(user => !managerIds.has(user.id));
    }, [allUsers, contentManagers]);

    // Filter users based on search term
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return [];
        
        const term = searchTerm.toLowerCase().trim();
        return eligibleUsers.filter(user => {
            const email = user.email?.toLowerCase() || "";
            const displayName = user.display_name?.toLowerCase() || "";
            const fullName = user.full_name?.toLowerCase() || "";
            
            return email.includes(term) || 
                   displayName.includes(term) || 
                   fullName.includes(term);
        });
    }, [eligibleUsers, searchTerm]);

    const handleAdd = async () => {
        if (!selectedUser) return;
        
        const displayName = selectedUser.display_name || selectedUser.full_name || "משתמש";
        
        setIsAdding(true);
        try {
            await onAdd(selectedUser.id, displayName);
            // Reset dialog state
            setSearchTerm("");
            setSelectedUser(null);
        } finally {
            setIsAdding(false);
        }
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedUser(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[80vh]">
                <DialogHeader className="text-right">
                    <DialogTitle>הוספת מנהל תוכן</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="חפשו משתמש לפי אימייל או שם..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>

                    {/* Selected User Display */}
                    {selectedUser && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">
                                        נבחר: {selectedUser.display_name || selectedUser.full_name}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedUser(null)}
                                    className="text-blue-600 hover:bg-blue-100"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {searchTerm.trim() && (
                            <>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => {
                                        const displayName = user.display_name || user.full_name || "משתמש לא ידוע";
                                        const isSelected = selectedUser?.id === user.id;
                                        
                                        return (
                                            <div
                                                key={user.id}
                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    isSelected ? 
                                                        'border-blue-300 bg-blue-50' : 
                                                        'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">{displayName}</span>
                                                        {isSelected && (
                                                            <Badge className="bg-blue-100 text-blue-800">נבחר</Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3 h-3" />
                                                            <span>{user.email}</span>
                                                        </div>
                                                        
                                                        {user.city && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-3 h-3" />
                                                                <span>{user.city}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {user.phone_e164 && user.show_phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3 h-3" />
                                                                <span>{user.phone_e164}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        לא נמצאו משתמשים התואמים לחיפוש
                                    </div>
                                )}
                            </>
                        )}
                        
                        {!searchTerm.trim() && (
                            <div className="text-center py-8 text-gray-500">
                                התחילו להקליד כדי לחפש משתמשים
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex gap-2 w-full justify-end">
                        <Button variant="ghost" onClick={handleClose} disabled={isAdding}>
                            ביטול
                        </Button>
                        <Button 
                            onClick={handleAdd} 
                            disabled={!selectedUser || isAdding}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isAdding && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            הוסף כמנהל תוכן
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}