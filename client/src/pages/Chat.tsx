import { FC, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatContainer } from "@/components/ChatContainer";
import { RatesPanel } from "@/components/RatesPanel";
import { useMediaQuery } from "@/hooks/use-mobile";

export const Chat: FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ratesPanelVisible, setRatesPanelVisible] = useState(!isTablet);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  const toggleRatesPanel = () => {
    setRatesPanelVisible(!ratesPanelVisible);
  };
  
  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // On mobile, close the sidebar when a session is selected
    if (isMobile) {
      setSidebarVisible(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header 
        toggleSidebar={toggleSidebar} 
        toggleRatesPanel={toggleRatesPanel}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar as absolute overlay */}
        <div className={`absolute z-40 h-full transition-transform duration-300 ease-in-out ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar 
            visible={true} 
            setCurrentSessionId={handleSessionChange}
            currentSessionId={currentSessionId}
          />
          {/* Add backdrop for mobile */}
          <div 
            className={`fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-300 ${sidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={toggleSidebar}
          ></div>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 relative z-10">
          <ChatContainer 
            sessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
          />
        </div>
        
        {/* Rates panel */}
        {ratesPanelVisible && (
          <div className="w-72 border-l border-neutral-300 p-4 overflow-y-auto bg-white">
            <RatesPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
