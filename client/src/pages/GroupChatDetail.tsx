import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, ArrowLeft, Send, Mic, MicOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

// Add TypeScript interfaces for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface GroupChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  council: string;
  isOnline?: boolean;
}

// Sample mock data - in a real app, this would come from the API
interface GroupData {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  messages: GroupChatMessage[];
}

interface MockGroupCollection {
  [key: string]: GroupData;
}

const mockGroups: MockGroupCollection = {
  "group-1": {
    id: "group-1",
    name: "Treasury Management Network",
    description: "Discussion group for treasury management officers in UK councils",
    members: [
      { id: "user-1", name: "Jane Cooper", role: "admin", council: "Birmingham City Council", isOnline: true },
      { id: "user-2", name: "John Smith", role: "member", council: "Manchester City Council", isOnline: false },
      { id: "user-3", name: "Sarah Wilson", role: "member", council: "Leeds City Council", isOnline: true },
      { id: "user-4", name: "David Brown", role: "member", council: "Liverpool City Council", isOnline: false },
      { id: "user-5", name: "Emma Davies", role: "member", council: "Cardiff Council", isOnline: true },
    ],
    messages: [
      { 
        id: "msg-1", 
        senderId: "user-1", 
        senderName: "Jane Cooper", 
        content: "Welcome everyone to the Treasury Management Network group!",
        timestamp: "2025-03-26T13:00:00Z"
      },
      { 
        id: "msg-2", 
        senderId: "user-2", 
        senderName: "John Smith", 
        content: "Has anyone looked at the new PWLB guidance?",
        timestamp: "2025-03-26T14:15:00Z"
      },
      { 
        id: "msg-3", 
        senderId: "user-3", 
        senderName: "Sarah Wilson", 
        content: "Yes, we're reviewing it now. The new sustainability criteria are quite interesting.",
        timestamp: "2025-03-26T14:45:00Z"
      },
      { 
        id: "msg-4", 
        senderId: "user-1", 
        senderName: "Jane Cooper", 
        content: "I'll be sharing a summary document with the group later this week once our treasury team has completed the analysis.",
        timestamp: "2025-03-26T15:30:00Z"
      },
    ]
  },
  "group-2": {
    id: "group-2",
    name: "London Boroughs Finance Forum",
    description: "Financial officers from London boroughs discussing common challenges",
    members: [
      { id: "user-4", name: "Michael Thompson", role: "admin", council: "Camden Council", isOnline: true },
      { id: "user-5", name: "Emma Lewis", role: "member", council: "Hackney Council", isOnline: false },
      { id: "user-6", name: "Robert Johnson", role: "member", council: "Tower Hamlets Council", isOnline: false },
    ],
    messages: [
      { 
        id: "msg-1", 
        senderId: "user-4", 
        senderName: "Michael Thompson", 
        content: "Meeting scheduled for next Wednesday at 10am to discuss Q2 investment strategies",
        timestamp: "2025-03-26T09:00:00Z"
      },
      { 
        id: "msg-2", 
        senderId: "user-5", 
        senderName: "Emma Lewis", 
        content: "Will this be at Camden offices again?",
        timestamp: "2025-03-26T09:15:00Z"
      },
      { 
        id: "msg-3", 
        senderId: "user-4", 
        senderName: "Michael Thompson", 
        content: "Yes, same venue as last time. I'll send calendar invites shortly.",
        timestamp: "2025-03-26T09:30:00Z"
      }
    ]
  }
};

const GroupChatDetail: React.FC = () => {
  const [location] = useLocation();
  const groupId = location.split("/")[2]; // Extract the groupId from the URL
  const [message, setMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get group data from mock data
  const defaultGroup: GroupData = {
    id: "unknown",
    name: "Unknown Group",
    description: "Group not found",
    members: [],
    messages: []
  };
  
  // Use the groupId to look up the group or use the default
  const group: GroupData = mockGroups[groupId as keyof typeof mockGroups] || defaultGroup;
  
  const [messages, setMessages] = useState<GroupChatMessage[]>(group.messages || []);
  
  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      console.log("Speech recognition not supported in this browser");
    }
  }, []);

  // Set up speech recognition
  useEffect(() => {
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure recognition
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-GB'; // Set to British English

    // Set up event handlers
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(current => current + transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive"
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechSupported]);

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try a different browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Speak now. Voice recording will automatically stop after you pause.",
      });
    }
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const sendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: GroupChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderName: "You", // In a real app, this would be the current user's name
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
    
    // Simulate a successful message send
    toast({
      title: "Message sent",
      description: "Your message has been sent to the group",
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(date);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
      
      <main className="flex-1 container mx-auto py-4 px-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <Button asChild variant="outline" className="mr-2">
            <Link href="/groups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowMembers(!showMembers)}
            className={showMembers ? "text-primary" : ""}
          >
            <Users className="h-4 w-4 mr-2" />
            Members ({group.members.length})
          </Button>
        </div>
        
        <div className="flex-1 flex gap-4">
          <div className={`flex-1 flex flex-col ${showMembers ? 'md:w-2/3' : 'w-full'}`}>
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xl">{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex ${msg.senderId === 'current-user' ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                          {msg.senderId !== 'current-user' && (
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`rounded-lg p-3 ${
                            msg.senderId === 'current-user' 
                              ? 'bg-primary text-primary-foreground ml-2' 
                              : 'bg-neutral-100'
                          }`}>
                            <div className="text-xs mb-1 flex justify-between">
                              <span className="font-medium">{msg.senderName}</span>
                              <span className="text-xs text-secondary/70 ml-4">{formatDate(msg.timestamp)}</span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  {isListening && (
                    <div className="bg-primary/10 text-primary text-sm p-2 rounded-md mb-2 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      <span>Listening to your voice... Speak clearly.</span>
                    </div>
                  )}
                  
                  <div className="flex">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        placeholder={isListening ? "Listening to your voice..." : "Type your message..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className={`pr-10 w-full border ${isListening ? 'border-primary' : 'border-neutral-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200`}
                      />
                      {speechSupported && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={toggleListening}
                          className={`absolute right-3 top-2.5 ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400 hover:text-primary'}`}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <Button 
                      className="ml-2" 
                      onClick={sendMessage}
                      disabled={!message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {speechSupported && (
                    <div className="mt-2 text-xs text-center text-secondary/70">
                      Click the microphone icon to use voice commands
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {showMembers && (
            <Card className="hidden md:block md:w-1/3 h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Group Members
                </CardTitle>
                <CardDescription>
                  {group.members.length} members in this group
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {group.members.map((member: GroupMember) => (
                      <div key={member.id} className="flex items-center p-2 rounded-md hover:bg-neutral-100">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center">
                            {member.name}
                            {member.isOnline && (
                              <span className="h-2 w-2 rounded-full bg-green-500 ml-2"></span>
                            )}
                          </div>
                          <div className="text-xs text-secondary/70">{member.council}</div>
                        </div>
                        
                        {member.role === 'admin' && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" size="sm">
                  Invite Members
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-neutral-300 py-3 mt-auto">
        <div className="container mx-auto text-center text-sm text-secondary/70">
          &copy; {new Date().getFullYear()} UK Council Money Market. All rights reserved.
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default GroupChatDetail;