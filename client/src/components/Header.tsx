import { FC } from "react";
import { Menu, BarChart, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useNotifications } from "@/contexts/NotificationContext";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleRatesPanel?: () => void;
}

export const Header: FC<HeaderProps> = ({ toggleSidebar, toggleRatesPanel }) => {
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [location, setLocation] = useLocation();
  const { soundEnabled, toggleSound } = useNotifications();
  
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
        
        {/* Empty space where navigation links used to be */}
        <div className="flex-grow"></div>
        
        <div className="flex items-center space-x-2">
          {/* Sound toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSound}
            className={`text-foreground ${soundEnabled ? 'bg-blue-50' : ''}`}
            title={soundEnabled ? "Sound notifications enabled" : "Sound notifications disabled"}
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-blue-600" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
          
          {/* Rates panel toggle for tablet view */}
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
          
          {/* Sidebar toggle button - always visible for all screen sizes */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="relative" 
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              6
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
