import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  PlusCircle, 
  MessageSquare, 
  MoreVertical, 
  UserPlus, 
  Trash2, 
  Edit 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface GroupChatProps {
  onSelectChat?: (groupId: string) => void;
}

interface GroupChatData {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  council: string;
}

// Mock data for demonstration
const mockGroups: GroupChatData[] = [
  {
    id: "group-1",
    name: "Treasury Management Network",
    description: "Discussion group for treasury management officers in UK councils",
    members: [
      { id: "user-1", name: "Jane Cooper", role: "admin", council: "Birmingham City Council" },
      { id: "user-2", name: "John Smith", role: "member", council: "Manchester City Council" },
      { id: "user-3", name: "Sarah Wilson", role: "member", council: "Leeds City Council" },
    ],
    lastMessage: "Has anyone looked at the new PWLB guidance?",
    lastMessageTime: "2 hours ago",
    unreadCount: 3
  },
  {
    id: "group-2",
    name: "London Boroughs Finance Forum",
    description: "Financial officers from London boroughs discussing common challenges",
    members: [
      { id: "user-4", name: "Michael Thompson", role: "admin", council: "Camden Council" },
      { id: "user-5", name: "Emma Lewis", role: "member", council: "Hackney Council" },
      { id: "user-6", name: "Robert Johnson", role: "member", council: "Tower Hamlets Council" },
    ],
    lastMessage: "Meeting scheduled for next Wednesday at 10am",
    lastMessageTime: "Yesterday",
    unreadCount: 1
  },
];

const GroupChat: React.FC<GroupChatProps> = ({ onSelectChat }) => {
  const [groups, setGroups] = useState<GroupChatData[]>(mockGroups);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const newGroup: GroupChatData = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      description: newGroupDescription,
      members: [
        // Current user would be added as admin
        { id: "current-user", name: "You", role: "admin", council: "Your Council" },
      ],
    };

    setGroups([newGroup, ...groups]);
    setNewGroupName("");
    setNewGroupDescription("");
    setIsCreateDialogOpen(false);

    toast({
      title: "Success",
      description: `Group "${newGroupName}" has been created`,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
    
    toast({
      title: "Group deleted",
      description: "The group has been successfully deleted",
    });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" /> 
          Group Chats
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Group Chat</DialogTitle>
              <DialogDescription>
                Create a group to discuss council finance matters with colleagues.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Treasury Network"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What is this group about?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <Users className="h-12 w-12 text-secondary/50 mb-2" />
            <p className="text-secondary/70">No group chats yet.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[420px]">
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:bg-accent/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {group.name}
                        {group.unreadCount && group.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 px-2">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-1">
                        {group.description}
                      </CardDescription>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Members
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="flex items-center space-x-1 mb-3">
                    {group.members.slice(0, 3).map((member, idx) => (
                      <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    
                    {group.members.length > 3 && (
                      <div className="text-xs text-secondary/70 ml-1">
                        +{group.members.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  {group.lastMessage && (
                    <div className="text-sm text-secondary line-clamp-1 flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                      {group.lastMessage}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0 flex justify-between">
                  <div className="text-xs text-secondary/70">
                    {group.lastMessageTime && (
                      <span>Last activity: {group.lastMessageTime}</span>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Call the onSelectChat callback for any component logic
                      if (onSelectChat) onSelectChat(group.id);
                      
                      // Navigate to the group chat detail page
                      window.location.href = `/groups/${group.id}`;
                    }}
                  >
                    Join Chat
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default GroupChat;