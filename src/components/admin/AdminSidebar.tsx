import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Building, 
  Users, 
  CheckCircle, 
  FileText,
  Upload,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  User,
  LogOut,
  Clock
} from 'lucide-react';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ElementType;
  isTab?: boolean;
}

interface AdminSidebarProps {
  userName?: string;
  userInitials?: string;
  userAvatarUrl?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  onLogout?: () => void;
}

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

export const AdminSidebar = ({ 
  userName = 'User',
  userInitials = 'U',
  userAvatarUrl,
  isAdmin = false,
  isStaff = false,
  onLogout = () => {}
}: AdminSidebarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Define navigation items based on user roles - removing admin tools from sidebar
  const generateNavigation = () => {
    const items = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Organization', path: '/organization', icon: Building },
      { name: 'Courses', path: '/courses', icon: BookOpen },
      { name: 'Transactions', path: '/transactions', icon: Clock },
      { name: 'Admin', path: '/admin', icon: Users },
    ];
    
    return items;
  };

  const navigation = generateNavigation();
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path.includes('?')) {
      // For paths with query parameters
      const basePath = path.split('?')[0];
      const queryParams = new URLSearchParams(path.split('?')[1]);
      const currentParams = new URLSearchParams(location.search);
      
      return location.pathname === basePath && 
        queryParams.get('tab') === currentParams.get('tab');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile menu dialog */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" />

          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5">
                <button 
                  type="button" 
                  onClick={() => setSidebarOpen(false)} 
                  className="-m-2.5 p-2.5 text-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* Sidebar for mobile */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=red&shade=600"
                    alt="Duct Points"
                  />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              onClick={() => setSidebarOpen(false)}
                              className={classNames(
                                isActive(item.path)
                                  ? 'bg-gray-50 text-red-600'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-red-600',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold',
                              )}
                            >
                              <item.icon
                                className={classNames(
                                  isActive(item.path) ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600',
                                  'h-6 w-6 shrink-0',
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    
                    {/* User profile section */}
                    <li className="-mx-6 mt-auto">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900">
                          {userAvatarUrl ? (
                            <img
                              src={userAvatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full bg-gray-50"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-700">{userInitials}</span>
                            </div>
                          )}
                          <span>{userName}</span>
                        </div>
                        
                        <Link
                          to="/profile"
                          className="flex items-center gap-x-4 px-6 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          <User className="h-5 w-5 text-gray-400" />
                          <span>Profile</span>
                        </Link>
                        
                        <button
                          onClick={onLogout}
                          className="flex items-center gap-x-4 px-6 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 w-full text-left"
                        >
                          <LogOut className="h-5 w-5 text-gray-400" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=red&shade=600"
              alt="Duct Points"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={classNames(
                          isActive(item.path)
                            ? 'bg-gray-50 text-red-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-red-600',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold',
                        )}
                      >
                        <item.icon
                          className={classNames(
                            isActive(item.path) ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600',
                            'h-6 w-6 shrink-0',
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* User profile section */}
              <li className="-mx-6 mt-auto">
                <div className="flex flex-col">
                  <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full bg-gray-50"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-700">{userInitials}</span>
                      </div>
                    )}
                    <span>{userName}</span>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center gap-x-4 px-6 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <User className="h-5 w-5 text-gray-400" />
                    <span>Profile</span>
                  </Link>
                  
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-x-4 px-6 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 w-full text-left"
                  >
                    <LogOut className="h-5 w-5 text-gray-400" />
                    <span>Logout</span>
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header with hamburger menu */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
        <button 
          type="button" 
          onClick={() => setSidebarOpen(true)} 
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold text-gray-900">
          {navigation.find(item => isActive(item.path))?.name || 'Dashboard'}
        </div>
        <div>
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt=""
              className="h-8 w-8 rounded-full bg-gray-50"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-700">{userInitials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content wrapper for sidebar layout - this ensures proper spacing */}
      <div className="lg:pl-72"></div>
    </>
  );
};

export default AdminSidebar; 