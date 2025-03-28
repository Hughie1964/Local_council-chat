import { FC, useEffect, useState } from "react";
import { Link } from "wouter";
import { Session, Council } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRecentConversations, getCouncilInfo, createNewSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileText, Info, Plus, Shield, Users, UserPlus, BarChart, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  visible: boolean;
  setCurrentSessionId: (sessionId: string) => void;
  currentSessionId?: string;
}

export const Sidebar: FC<SidebarProps> = ({ 
  visible, 
  setCurrentSessionId,
  currentSessionId
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [council, setCouncil] = useState<Council | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const councilData = await getCouncilInfo();
        setCouncil(councilData);
        
        const sessionsData = await getRecentConversations();
        setSessions(sessionsData);
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      }
    };

    fetchData();
  }, []);

  const handleNewConversation = async () => {
    setIsLoading(true);
    try {
      const { sessionId } = await createNewSession();
      setCurrentSessionId(sessionId);
      
      // Refresh sessions list
      const sessionsData = await getRecentConversations();
      setSessions(sessionsData);
      
      toast({
        title: "New conversation started",
        description: "You can now start chatting with the AI assistant",
      });
    } catch (error) {
      toast({
        title: "Error starting new conversation",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <aside className="w-64 bg-white border-r border-neutral-300 h-full overflow-y-auto">
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
              Council Information
            </h2>
            <div className="bg-neutral-100 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium">{council?.name || "Loading council..."}</p>
              <p className="text-xs text-secondary/70">{`ID: ${council?.councilId || "..."}`}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary/70">
              <span>Financial Year: {council?.financialYear || "..."}</span>
              <button className="text-primary hover:text-primary-dark">Change</button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
              Recent Conversations
            </h2>
            <ul className="space-y-2">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <li 
                    key={session.sessionId}
                    onClick={() => setCurrentSessionId(session.sessionId)}
                    className={`text-sm p-2 rounded-md cursor-pointer hover:bg-neutral-100 ${
                      currentSessionId === session.sessionId ? "bg-neutral-100" : ""
                    }`}
                  >
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-xs text-secondary/70">
                      {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm p-2">No recent conversations</li>
              )}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
              Community
            </h2>
            <ul className="space-y-1">
              <li>
                <Link href="/groups" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <Users className="h-4 w-4 mr-2" />
                  Group Chats
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Community
                </Link>
              </li>
              <li>
                <Link href="/my-trades" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <BarChart className="h-4 w-4 mr-2" />
                  My Trades
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <Newspaper className="h-4 w-4 mr-2" />
                  UK Financial News
                </Link>
              </li>
              <li>
                <Link href="/super-user-dashboard" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Super User Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
              Resources
            </h2>
            <ul className="space-y-1">
              <li>
                <a href="https://www.cipfa.org/policy-and-guidance/publications/c/code-of-practice-on-treasury-management-fully-digital" target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <FileText className="h-4 w-4 mr-2" />
                  CIPFA Guidelines
                </a>
              </li>
              <li>
                <a href="https://www.cipfa.org/policy-and-guidance/publications/t/treasury-management-in-the-public-services-code-of-practice-and-crosssectoral-guidance-notes-2021-edition" target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Treasury Management Code
                </a>
              </li>
              <li>
                <a href="https://www.dmo.gov.uk/responsibilities/local-authority-lending/" target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <FileText className="h-4 w-4 mr-2" />
                  PWLB Lending Facility
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-secondary hover:text-primary flex items-center py-1">
                  <Info className="h-4 w-4 mr-2" />
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
        </div>
      </ScrollArea>
      <div className="border-t border-neutral-300 p-4">
        <Button
          variant="outline"
          className="w-full bg-neutral-200 hover:bg-neutral-300 text-secondary font-medium py-2 px-4 transition-colors duration-200 flex items-center justify-center"
          onClick={handleNewConversation}
          disabled={isLoading}
        >
          <Plus className="h-5 w-5 mr-2" />
          New Conversation
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
