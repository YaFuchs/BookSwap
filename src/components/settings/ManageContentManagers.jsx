import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppNotifications } from "../hooks/useAppNotifications";
import ContentManagerItem from "./ContentManagerItem";
import AddContentManagerDialog from "./AddContentManagerDialog";
import { listUsersForContentManager } from "@/api/functions";
import { addContentManagerPermission } from "@/api/functions";
import { removeContentManagerPermission } from "@/api/functions";

export default function ManageContentManagers({ currentUser }) {
    const [allUsers, setAllUsers] = useState([]);
    const [contentManagers, setContentManagers] = useState([]);
    const [loadingManagers, setLoadingManagers] = useState(true);
    const [showAddManagerDialog, setShowAddManagerDialog] = useState(false);
    
    const notify = useAppNotifications();

    const loadUsers = useCallback(async () => {
        try {
            setLoadingManagers(true);
            const response = await listUsersForContentManager();
            const users = response.data || [];
            
            setAllUsers(users);
            
            const managers = users.filter(u => u.is_content_manager);
            setContentManagers(managers);
        } catch (error) {
            console.error("Error loading users:", error);
            notify.error("שגיאה בטעינת משתמשים", "לא ניתן לטעון את רשימת המשתמשים");
        } finally {
            setLoadingManagers(false);
        }
    }, [notify]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleRemoveManager = useCallback(async (managerId, managerName) => {
        try {
            const response = await removeContentManagerPermission({ userId: managerId });
            if (response.data?.success) {
                notify.success("הרשאה הוסרה", `${managerName} אינו מנהל תוכן יותר`);
                await loadUsers(); // Refresh the list
            }
        } catch (error) {
            console.error("Error removing content manager:", error);
            if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                notify.error("פעולה לא מותרת", "לא ניתן להסיר את ההרשאה שלך עצמך");
            } else {
                notify.error("שגיאה בהסרת הרשאה", "לא ניתן להסיר את הרשאת מנהל התוכן");
            }
        }
    }, [notify, loadUsers]);

    const handleAddManager = useCallback(async (userId, userName) => {
        try {
            const response = await addContentManagerPermission({ userId });
            if (response.data?.success) {
                notify.success("הרשאה נוספה", `${userName} הוא כעת מנהל תוכן`);
                await loadUsers(); // Refresh the list
                setShowAddManagerDialog(false);
            }
        } catch (error) {
            console.error("Error adding content manager:", error);
            notify.error("שגיאה בהוספת הרשאה", "לא ניתן להוסיף את הרשאת מנהל התוכן");
        }
    }, [notify, loadUsers]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-blue-600" />
                            <CardTitle>מנהלי התוכן באפליקציה</CardTitle>
                        </div>
                        <Button
                            onClick={() => setShowAddManagerDialog(true)}
                            disabled={loadingManagers}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 ml-2" />
                            הוסף מנהל תוכן
                        </Button>
                    </div>
                    <CardDescription>
                        ניהול הרשאות מנהלי התוכן. מנהלי תוכן יכולים להוסיף ולערוך ספרים, ולנהל הרשאות של מנהלי תוכן אחרים.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingManagers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            <span className="mr-2 text-gray-600">טוען משתמשים...</span>
                        </div>
                    ) : contentManagers.length > 0 ? (
                        <div className="space-y-3">
                            {contentManagers.map(manager => (
                                <ContentManagerItem
                                    key={manager.id}
                                    manager={manager}
                                    onRemove={handleRemoveManager}
                                    currentUserId={currentUser?.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>לא נמצאו מנהלי תוכן</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddContentManagerDialog
                open={showAddManagerDialog}
                onOpenChange={setShowAddManagerDialog}
                allUsers={allUsers}
                contentManagers={contentManagers}
                onAdd={handleAddManager}
            />
        </>
    );
}