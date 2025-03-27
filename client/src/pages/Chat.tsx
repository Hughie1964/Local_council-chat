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
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);
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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          visible={sidebarVisible} 
          setCurrentSessionId={handleSessionChange}
          currentSessionId={currentSessionId}
        />
        <ChatContainer 
          sessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
        />
        {ratesPanelVisible && (
          <div className="w-72 border-l border-neutral-300 p-4 overflow-y-auto bg-white hidden lg:block">
            <RatesPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
