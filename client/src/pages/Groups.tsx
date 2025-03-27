import React, { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import GroupChat from "@/components/GroupChat";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus,
  MessageSquare
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

const Groups: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const handleSelectChat = (groupId: string) => {
    setSelectedGroupId(groupId);
    
    // In a real app, we would navigate to the specific group chat
    // For now, we'll just log it
    console.log(`Navigating to group chat: ${groupId}`);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header toggleSidebar={toggleSidebar} />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Council Chat Groups</h1>
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href="/">
                <MessageSquare className="h-4 w-4 mr-2" />
                Back to AI Chat
              </Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Community
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-groups" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              My Groups
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discover Groups
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-groups" className="w-full">
            <div className="max-w-4xl mx-auto">
              <GroupChat onSelectChat={handleSelectChat} />
            </div>
          </TabsContent>
          
          <TabsContent value="discover" className="w-full">
            <div className="max-w-4xl mx-auto p-6 text-center">
              <Users className="h-16 w-16 mx-auto text-secondary/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Discover Council Chat Groups</h3>
              <p className="text-secondary/70 mb-4">
                Join specialized discussion groups with finance professionals from UK councils.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
                {[
                  {
                    name: "Investment Strategy Network",
                    members: 24,
                    description: "Discussions on council investment strategies and market outlooks"
                  },
                  {
                    name: "PWLB Rate Monitors",
                    members: 18,
                    description: "Tracking and analysis of PWLB rate changes and borrowing opportunities"
                  },
                  {
                    name: "Treasury Management Officers",
                    members: 36,
                    description: "Professional network for treasury management in UK local authorities"
                  },
                  {
                    name: "Financial Reporting Standards",
                    members: 15,
                    description: "Updates and discussions on financial reporting for local councils"
                  }
                ].map((group, idx) => (
                  <div key={idx} className="border rounded-lg p-4 text-left">
                    <h4 className="font-medium">{group.name}</h4>
                    <p className="text-sm text-secondary/70 mb-3">{group.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary/70">{group.members} members</span>
                      <Button size="sm" variant="outline">Join Group</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-white border-t border-neutral-300 py-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-secondary/70">
          &copy; {new Date().getFullYear()} UK Council Money Market. All rights reserved.
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Groups;