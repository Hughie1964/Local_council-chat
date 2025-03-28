import { FC } from "react";
import { Menu, BarChart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleRatesPanel?: () => void;
}

export const Header: FC<HeaderProps> = ({ toggleSidebar, toggleRatesPanel }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [location, setLocation] = useLocation();
  
  const isHomePage = location === "/" || location === "";
  
  const goHome = () => {
    setLocation("/");
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b py-3 px-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer" 
          onClick={goHome}
          title="Go to Home Page"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg gradient-text">
              UK Council Money Market
            </h1>
            <p className="text-xs text-muted-foreground">
              Financial advisory AI assistant
            </p>
          </div>
        </div>
        
        {!isMobile && (
          <div className="hidden md:flex items-center space-x-1">
            <a
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              AI Chat
            </a>
            <a
              href="/groups"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              Group Chats
            </a>
            <a
              href="/signup"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              Join Community
            </a>
            <a
              href="/my-trades"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              My Trades
            </a>
            <a
              href="/news"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              UK Financial News
            </a>
            <a
              href="/super-user-dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors duration-200"
            >
              Super User Dashboard
            </a>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {!isHomePage && (
            <Button
              variant="outline"
              size="icon"
              onClick={goHome}
              className="text-foreground"
              title="Go to Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          
          {isTablet && toggleRatesPanel && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleRatesPanel}
              className="text-foreground"
              title="Toggle Rates Panel"
            >
              <BarChart className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
