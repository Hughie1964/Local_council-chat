import { FC } from "react";
import { Message } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Brain, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const formattedTime = message.timestamp 
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "";

  const loadingIndicator = (
    <div className="flex space-x-1 my-2">
      <div className="w-2 h-2 bg-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
      <div className="w-2 h-2 bg-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      <div className="w-2 h-2 bg-secondary/70 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
  );

  const contentWithHtml = message.content.replace(/\n/g, "<br>");
  
  // Handle tables with a simple solution that doesn't use the 's' flag
  const tableFormattedContent = contentWithHtml.replace(
    /<table([^>]*)>([\s\S]*?)<\/table>/g,
    (match) => `<div class="bg-white rounded-md border border-neutral-300 p-2 my-2 overflow-auto">${match}</div>`
  );

  return message.isUser ? (
    <div className="flex items-start justify-end mb-6">
      <div className="user-message shadow-md">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: tableFormattedContent }}></div>
        <p className="text-xs text-primary-foreground/80 mt-2 text-right">{formattedTime}</p>
        {message.loading && loadingIndicator}
      </div>
      <div className="ml-2 flex-shrink-0">
        <Avatar className="h-8 w-8 border-2 border-primary">
          <AvatarFallback className="bg-primary-foreground text-primary">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  ) : (
    <div className="flex items-start mb-6">
      <div className="mr-2 flex-shrink-0">
        <Avatar className="h-8 w-8 border-2 border-muted">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="ai-message shadow-md">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: tableFormattedContent }}></div>
        <p className="text-xs text-muted-foreground/80 mt-2">{formattedTime}</p>
        {message.loading && loadingIndicator}
      </div>
    </div>
  );
};
