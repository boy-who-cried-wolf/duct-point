
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, LayoutDashboard, Users, Shield, Activity, Database, BookOpen } from 'lucide-react';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../App';

interface NavbarProps {
  userName?: string;
  userInitials?: string;
  userAvatarUrl?: string;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  userName = 'User',
  userInitials = 'U',
  userAvatarUrl,
  onLogout = () => {},
}) => {
  const location = useLocation();
  const { isAdmin, isStaff, platformRole } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Logo />
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/organization" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/organization') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Organization
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  isActive('/admin') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            )}
            {isStaff && (
              <Link 
                to="/admin?tab=redemptions" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  isActive('/admin') && location.search.includes('tab=redemptions') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Activity className="h-3 w-3" />
                Redemptions
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatarUrl} alt={userName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {platformRole || (isAdmin ? "Admin" : "User")}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="cursor-pointer flex w-full items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer flex w-full items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/organization" className="cursor-pointer flex w-full items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Organization</span>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer flex w-full items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {isStaff && !isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin?tab=redemptions" className="cursor-pointer flex w-full items-center">
                    <Activity className="mr-2 h-4 w-4" />
                    <span>Redemptions</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
