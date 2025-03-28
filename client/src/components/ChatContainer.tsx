import { FC, useState, useEffect, useRef } from "react";
import { Message } from "@/types";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendMessage, getSessionMessages } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share, MoreVertical } from "lucide-react";
import { NotificationPopup } from "@/components/NotificationPopup";
// import { useNotification } from "@/components/ui/notification";

interface ChatContainerProps {
  sessionId?: string;
  setCurrentSessionId: (sessionId: string) => void;
}

export const ChatContainer: FC<ChatContainerProps> = ({ 
  sessionId,
  setCurrentSessionId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState({ isError: false, message: "" });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Display welcome message on first load
    if (isFirstLoad && !sessionId) {
      setIsFirstLoad(false);
      setMessages([
        {
          id: 0,
          sessionId: "welcome",
          content: `
          <p>Hello and welcome to the UK Council Money Market Assistant. I'm here to help with financial inquiries related to:</p>
          <ul style="list-style-type: disc; padding-left: 20px; margin: 8px 0;">
            <li>PWLB borrowing rates and strategies</li>
            <li>Money market fund investments</li>
            <li>Cash flow management</li>
            <li>Treasury management strategies</li>
            <li>Debt restructuring options</li>
          </ul>
          <p>How can I assist your council today?</p>
          `,
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isFirstLoad, sessionId]);

  useEffect(() => {
    // Load existing messages if sessionId changes
    const fetchMessages = async () => {
      if (sessionId) {
        try {
          const messagesData = await getSessionMessages(sessionId);
          setMessages(messagesData);
        } catch (error) {
          console.error("Error fetching messages:", error);
          toast({
            title: "Error fetching messages",
            description: "Unable to load conversation history",
            variant: "destructive",
          });
        }
      }
    };

    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId, toast]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Create a temporary user message and loading AI message
    const newUserMessage: Message = {
      id: Date.now(),
      sessionId: sessionId || "new",
      content,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    const loadingMessage: Message = {
      id: Date.now() + 1,
      sessionId: sessionId || "new",
      content: "",
      isUser: false,
      timestamp: new Date().toISOString(),
      loading: true
    };

    // Update messages with the new user message and loading message
    setMessages(prev => [...prev, newUserMessage, loadingMessage]);

    try {
      // Send the message to the server
      const response = await sendMessage(content, sessionId);
      
      // Create the AI response message
      const aiResponseMessage = {
        id: Date.now() + 2,
        sessionId: sessionId || response.sessionId,
        content: response.message,
        isUser: false,
        timestamp: new Date().toISOString(),
        loading: false
      };
      
      // Update messages with the AI response
      setMessages(prev => prev.map(msg => 
        msg.loading ? aiResponseMessage : msg
      ));
      
      // Show notification for the new message
      toast({
        title: "New Message",
        description: "You've received a new message from Money Market Assistant"
      });
      
      // Set the new message for popup
      setNewMessage(aiResponseMessage);
      
      // If this is a new session, update the sessionId
      if (!sessionId) {
        setCurrentSessionId(response.sessionId);
      }
      
      // Reset error state if there was one
      if (error.isError) {
        setError({ isError: false, message: "" });
      }
    } catch (err) {
      // Handle error
      console.error("Error sending message:", err);
      setError({
        isError: true,
        message: "Unable to connect to the server. Please check your connection and try again."
      });
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => !msg.loading));
    }
  };

  // Function to handle closing notification popup
  const handleCloseNotification = () => {
    setNewMessage(null);
  };

  // Function to handle clicking "View Message" in notification
  const handleViewMessage = () => {
    setNewMessage(null);
    // Scroll to the latest message
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="border-b border-neutral-300 p-4 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-primary">Money Market Assistant</h2>
          <p className="text-xs text-secondary/70">Providing financial insights for UK local councils</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-secondary hover:text-primary hover:bg-neutral-100 rounded-full">
            <Copy className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-secondary hover:text-primary hover:bg-neutral-100 rounded-full">
            <Share className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-secondary hover:text-primary hover:bg-neutral-100 rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 h-[calc(100vh-14rem)] overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isError={error.isError}
        errorMessage={error.message}
        resetError={() => setError({ isError: false, message: "" })}
      />

      {/* Notification Popup */}
      <NotificationPopup
        message={newMessage}
        onClose={handleCloseNotification}
        onViewMessage={handleViewMessage}
      />
    </main>
  );
};
