
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Removed Link as it's not used
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Loader2, ShieldX, BookCopy, GraduationCap, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchGrades } from "../components/constants/grades";
import SubjectManager from "../components/settings/SubjectManager";
import GradeManager from "../components/settings/GradeManager";
import ManageContentManagers from "../components/settings/ManageContentManagers";
import AddBookSection from "../components/settings/AddBookSection";

const menuItems = [
{ id: "add-book", label: "הוספת ספר לקטלוג", icon: BookCopy },
{ id: "grades", label: "ניהול שכבות", icon: GraduationCap },
{ id: "subjects", label: "ניהול נושאים", icon: BookOpen },
{ id: "managers", label: "ניהול מנהלי תוכן", icon: Users }];


export default function ContentManagerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [dynamicGrades, setDynamicGrades] = useState([]);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Added setSearchParams
  const activeSection = searchParams.get("section") || "add-book";

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // setLoading(true) is not needed here as it's the initial state
        const [currentUser, gradesData] = await Promise.all([
        User.me(),
        fetchGrades()]
        );
        setUser(currentUser);
        setDynamicGrades(gradesData || []);

        if (currentUser && currentUser.is_content_manager) {
          setIsAuthorized(true);
        } else {
          // This navigate will cause a full page change, which is correct for unauthorized users.
          navigate(createPageUrl("BookFair"));
        }
      } catch (error) {
        // This navigate will cause a full page change, which is correct for unauthenticated users.
        navigate(createPageUrl("Landing"));
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [navigate]); // This effect should only run once on initial mount.

  const handleSectionChange = (sectionId) => {
    // Use setSearchParams to update the URL query without a page reload.
    setSearchParams({ section: sectionId });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "grades":
        return <GradeManager />;
      case "subjects":
        return <SubjectManager />;
      case "managers":
        return <ManageContentManagers currentUser={user} />;
      case "add-book":
      default:
        return <AddBookSection user={user} dynamicGrades={dynamicGrades} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--header-height))]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>);

  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] text-center p-4">
                <ShieldX className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">אין הרשאה</h1>
                <p className="text-gray-500 mb-6">אזור זה מיועד למנהלי תוכן בלבד.</p>
                <Button onClick={() => navigate(createPageUrl("BookFair"))}>
                    חזרה ליריד
                </Button>
            </div>);

  }

  return (
    <div dir="rtl" className="bg-neutral-50 p-4 min-h-screen md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-900">ניהול תוכן</h1>
                    <p className="text-gray-600 mt-2">ניהול נושאים, שכבות ומשתמשים במערכת</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
                    {/* Side Navigation */}
                    <aside className="p-4 rounded-lg md:sticky md:top-6">
                        <nav className="space-y-2">
                            {menuItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-right ${
                    isActive ?
                    'bg-blue-50 text-blue-700' :
                    'text-gray-700 hover:bg-gray-100'}`
                    }>

                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </button>);

              })}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <main className="space-y-6">
                        {renderSection()}
                    </main>
                </div>
            </div>
        </div>);

}