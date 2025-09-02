

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Store, Settings, User as UserIcon, LogOut, Loader2, Library, MessageSquareText, Menu, Filter, HelpCircle } from "lucide-react";
import { User } from "@/api/entities";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ProfileEditDialog from "../components/user/ProfileEditDialog";
import FeedbackDialog from "../components/user/FeedbackDialog";

const AuthWrapper = ({ children, currentPageName }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const checkAuth = React.useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      // If user is not authenticated, redirect to login.
      // After login, they will be redirected to the main Book Catalog page.
      await User.loginWithRedirect(window.location.origin + createPageUrl("BookCatalog"));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }
  
  return <AppLayout user={user} currentPageName={currentPageName} onProfileUpdate={checkAuth}>{children}</AppLayout>;
};

const AppLayout = ({ children, user, currentPageName, onProfileUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [showProfileEditDialog, setShowProfileEditDialog] = React.useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = React.useState(false);
  const [areFiltersActive, setAreFiltersActive] = React.useState(false);

  const isProfileIncomplete = !user?.display_name || user.display_name.trim() === '' || !user?.phone_e164 || user.phone_e164.trim() === '' || !user?.city || user.city.trim() === '' || user?.show_phone === false;

  React.useEffect(() => {
    // Listen for filter status updates from pages
    const handleFilterStatusUpdate = (event) => {
      setAreFiltersActive(event.detail.hasActiveFilters);
    };

    // Listen for profile update events from other components
    const handleProfileUpdate = () => {
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    };

    document.addEventListener('filter-status-update', handleFilterStatusUpdate);
    document.addEventListener('profile-updated', handleProfileUpdate);

    // Reset filter status when navigating to different pages
    setAreFiltersActive(false);

    return () => {
      document.removeEventListener('filter-status-update', handleFilterStatusUpdate);
      document.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [location.pathname, onProfileUpdate]);

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const navigationItems = [
    { title: "קטלוג הספרים", url: createPageUrl("BookCatalog"), icon: Library },
    { title: "יריד הספרים", url: createPageUrl("BookFair"), icon: Store },
  ];

  // Function to get page title for mobile header
  const getPageTitle = () => {
    // First try to match with navigation items
    const navItem = navigationItems.find(item => location.pathname === item.url);
    if (navItem) {
      return navItem.title;
    }
    
    // Special case: treat root URL as Book Catalog
    if (location.pathname === "/") {
      return "קטלוג הספרים";
    }

    if (location.pathname === createPageUrl("FAQ")) {
      return "שאלות נפוצות";
    }
    
    // Handle content manager settings page
    if (location.pathname === createPageUrl("ContentManagerSettings")) {
      return "ניהול תוכן";
    }
    
    // Default fallback
    return "BookSwap";
  };

  // Check if current page should show filter icon
  const shouldShowFilterIcon = () => {
    return location.pathname === createPageUrl("BookCatalog") || 
           location.pathname === createPageUrl("BookFair") ||
           location.pathname === "/"; // Add root URL check
  };

  const handleMobileFilterClick = () => {
    // Dispatch a custom event that the page components can listen for.
    document.dispatchEvent(new CustomEvent('open-mobile-filters'));
  };

  // Function to render sidebar content, adaptable for mobile (Sheet) or desktop
  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 p-4">
          <div className={`flex items-center ${isMobile ? 'gap-3' : (isSidebarCollapsed ? 'justify-center' : 'gap-3')}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isMobile ? '' : (isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full')}`}>
              <h2 className="font-bold text-gray-900">BookSwap</h2>
              <p className="text-xs text-gray-500">החלפת ספרי לימוד</p>
            </div>
          </div>
        </div>
        
        <div className="p-2 flex-grow overflow-y-auto">
          <div>
            {navigationItems.map((item) => {
              let isActive = location.pathname === item.url;
              // Special case: Highlight "Book Catalog" when on the root URL ("/")
              if (item.url === createPageUrl("BookCatalog") && location.pathname === "/") {
                isActive = true;
              }

              const linkContent = (
                <div 
                  className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 ${isMobile ? 'gap-3 px-3' : (isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3')} ${
                    isActive ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className={`font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isMobile ? '' : (isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full')}`}>
                    {item.title}
                  </span>
                </div>
              );
              return (
                <div key={item.title} className="mb-1">
                  {isMobile ? (
                    <SheetClose asChild>
                      <Link to={item.url}>{linkContent}</Link>
                    </SheetClose>
                  ) : (
                    <Link to={item.url}>{linkContent}</Link>
                  )}
                </div>
              )
            })}
          </div>
          {user?.is_content_manager && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                  <div key="Content Manager Settings" className="mb-1">
                      {isMobile ? (
                        <SheetClose asChild>
                           <Link 
                              to={createPageUrl("ContentManagerSettings")} 
                              className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 gap-3 px-3 ${
                                  location.pathname === createPageUrl("ContentManagerSettings") ? 'bg-blue-50 text-blue-700' : ''
                              }`}
                          >
                            <Settings className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium whitespace-nowrap overflow-hidden">ניהול תוכן</span>
                          </Link>
                        </SheetClose>
                      ) : (
                         <Link 
                            to={createPageUrl("ContentManagerSettings")} 
                            className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} ${
                                location.pathname === createPageUrl("ContentManagerSettings") ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                        >
                          <Settings className="w-4 h-4 flex-shrink-0" />
                          <span className={`font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
                            ניהול תוכן
                          </span>
                        </Link>
                      )}
                  </div>
              </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 mt-auto">
          <div className="space-y-3">
            <div className="mb-4">
              {isMobile ? (
                  <>
                    <SheetClose asChild>
                      <Link 
                        to={createPageUrl("FAQ")} 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 w-full gap-3 px-3 mb-2 ${location.pathname === createPageUrl("FAQ") ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                          <HelpCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap overflow-hidden">
                              שאלות נפוצות
                          </span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <button
                          onClick={() => setShowFeedbackDialog(true)}
                          className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 w-full gap-3 px-3"
                        >
                          <MessageSquareText className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap overflow-hidden">
                            משוב
                          </span>
                        </button>
                    </SheetClose>
                  </>
              ) : (
                <>
                  <Link 
                    to={createPageUrl("FAQ")} 
                    className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 w-full mb-2 ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} ${location.pathname === createPageUrl("FAQ") ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                      <HelpCircle className="w-4 h-4 flex-shrink-0" />
                      <span className={`font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
                          שאלות נפוצות
                      </span>
                  </Link>
                  <button
                    onClick={() => setShowFeedbackDialog(true)}
                    className={`hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 rounded-lg flex items-center py-2 w-full ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'}`}
                  >
                    <MessageSquareText className="w-4 h-4 flex-shrink-0" />
                    <span className={`font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'}`}>
                      משוב
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className={`flex items-center ${isMobile ? 'gap-3' : (isSidebarCollapsed ? 'justify-center' : 'gap-3')}`}>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-300 whitespace-nowrap overflow-hidden ${isMobile ? '' : (isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full')}`}>
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user?.display_name || user?.full_name || 'משתמש'}
                </p>
              </div>
            </div>

            {(isMobile || isSidebarCollapsed) ? ( 
              <div className={`flex ${isMobile ? 'gap-2' : 'justify-center'}`}>
                {/* Profile Edit Button */}
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'icon'} 
                  onClick={() => setShowProfileEditDialog(true)}
                  className={`relative ${isMobile ? 'flex-1 gap-2' : 'w-8 h-8'}`}
                >
                  {isProfileIncomplete && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white" />
                  )}
                  <Settings className={`flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {isMobile && <span>עריכת פרופיל</span>} 
                </Button>
                 {isMobile && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout} 
                        className="flex items-center text-xs transition-all duration-300 flex-1 gap-2"
                      >
                        <LogOut className="w-3 h-3 flex-shrink-0" />
                        <span>התנתקות</span>
                      </Button>
                 )}
              </div>
            ) : ( 
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowProfileEditDialog(true)}
                  className="relative flex items-center text-xs transition-all duration-300 flex-1 gap-2"
                >
                  {isProfileIncomplete && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white" />
                  )}
                  <Settings className="w-3 h-3 flex-shrink-0" />
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-full">
                    עריכת פרופיל
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="flex items-center text-xs transition-all duration-300 flex-1 gap-2"
                >
                  <LogOut className="w-3 h-3 flex-shrink-0" />
                  <span className="transition-all duration-300 whitespace-nowrap overflow-hidden opacity-100 max-w-full">
                    התנתקות
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
    </div>
  );

  return (
    <>
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <style>{`
          :root { --sidebar-width: 16rem; --header-height: 4rem; }
          .sidebar-content { border-right: 1px solid rgb(229 231 235); border-left: none; }
          body { font-family: 'Segoe UI', 'Heebo', sans-serif; }
        `}</style>

        {/* Use Sheet for mobile sidebar functionality */}
        <Sheet>
          {/* Wrap the Sheet's children in a Fragment to satisfy single child expectation if any */}
          <>
            <div className="h-screen flex w-full flex-row-reverse">
              {/* Desktop Sidebar - hidden on small screens */}
              <div 
                className={`hidden md:flex flex-col transition-all duration-300 bg-white shadow-lg sidebar-content ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
                onMouseEnter={() => setIsSidebarCollapsed(false)}
                onMouseLeave={() => setIsSidebarCollapsed(true)}
              >
                {sidebarContent(false)} {/* Render desktop version of sidebar content */}
              </div>

              <main className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header - visible on small screens, hidden on md and up */}
                <header className="bg-white border-b border-gray-200 px-4 py-2 md:hidden">
                  <div className="flex items-center justify-between gap-4">
                    <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                    <div className="flex items-center gap-2">
                      {/* Filter Icon - only show on BookCatalog and BookFair pages */}
                      {shouldShowFilterIcon() && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleMobileFilterClick}
                          className="relative"
                        >
                          <Filter className="w-6 h-6" />
                          {/* Blue dot indicator for active filters */}
                          {areFiltersActive && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 border border-white" />
                          )}
                          <span className="sr-only">פתח מסננים</span>
                        </Button>
                      )}
                      {/* SheetTrigger to open the mobile sidebar */}
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                          {isProfileIncomplete && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white" />
                          )}
                          <Menu className="w-6 h-6" />
                          <span className="sr-only">פתח תפריט</span>
                        </Button>
                      </SheetTrigger>
                    </div>
                  </div>
                </header>
                <div className="flex-1 overflow-auto">
                  {React.cloneElement(children, { onGlobalProfileUpdate: onProfileUpdate })}
                </div>
              </main>
            </div>
            
            {/* SheetContent for the mobile sidebar, appears from the left */}
            <SheetContent side="left" className="p-0 w-[280px]">
                {sidebarContent(true)} {/* Render mobile version of sidebar content */}
            </SheetContent>
          </>
        </Sheet>
      </div>
      <ProfileEditDialog 
        open={showProfileEditDialog}
        onOpenChange={setShowProfileEditDialog}
        currentUser={user}
        onProfileUpdated={onProfileUpdate}
      />
      <FeedbackDialog 
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        currentUser={user}
      />
    </>
  );
};

export default AuthWrapper;

