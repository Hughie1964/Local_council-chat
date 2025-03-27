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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
              href="#"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Resources
            </a>
            <a
              href="#"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
            >
              Help
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
