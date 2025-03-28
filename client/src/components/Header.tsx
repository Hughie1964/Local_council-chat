import { FC } from "react";
import { Menu, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleRatesPanel?: () => void;
}

export const Header: FC<HeaderProps> = ({ toggleSidebar, toggleRatesPanel }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  return (
    <header className="bg-white border-b border-neutral-300 py-3 px-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary"
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
          <div>
            <h1 className="font-sans font-semibold text-lg text-primary">
              UK Council Money Market
            </h1>
            <p className="text-xs text-secondary/70">
              Financial advisory AI assistant
            </p>
          </div>
        </div>
        
        {!isMobile && (
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              AI Chat
            </a>
            <a
              href="/groups"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Group Chats
            </a>
            <a
              href="/signup"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Join Community
            </a>
            <a
              href="/my-trades"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              My Trades
            </a>
            <a
              href="/news"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              UK Financial News
            </a>
            <a
              href="/super-user-dashboard"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Super User Dashboard
            </a>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {isTablet && toggleRatesPanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRatesPanel}
              className="text-secondary"
              title="Toggle Rates Panel"
            >
              <BarChart className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
