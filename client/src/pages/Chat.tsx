import { FC, useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatContainer } from "@/components/ChatContainer";
import { useMediaQuery } from "@/hooks/use-mobile";

export const Chat: FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
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
      <Header toggleSidebar={toggleSidebar} />
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
      </div>
    </div>
  );
};

export default Chat;
