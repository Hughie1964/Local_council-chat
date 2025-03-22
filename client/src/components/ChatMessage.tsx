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

  const contentWithHtml = message.content.replace(/\n/g, "<br>").replace(
    /<table(.*?)>(.*?)<\/table>/gs,
    (match) => `<div class="bg-white rounded-md border border-neutral-300 p-2 my-2 overflow-auto">${match}</div>`
  );

  return message.isUser ? (
    <div className="flex items-start justify-end">
      <div className="chat-bubble-user max-w-[80%] bg-primary text-white rounded-[18px_18px_0_18px] p-3">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: contentWithHtml }}></div>
        <p className="text-xs text-neutral-300 mt-1">{formattedTime}</p>
        {message.loading && loadingIndicator}
      </div>
      <div className="ml-2 flex-shrink-0">
        <Avatar className="h-8 w-8 bg-neutral-300">
          <AvatarFallback className="bg-neutral-300 text-secondary">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  ) : (
    <div className="flex items-start">
      <div className="mr-2 flex-shrink-0">
        <Avatar className="h-8 w-8 bg-primary text-white">
          <AvatarFallback className="bg-primary text-white">
            <Brain className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="chat-bubble-ai max-w-[80%] bg-[#f0f2f5] text-gray-900 rounded-[18px_18px_18px_0] p-3">
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: contentWithHtml }}></div>
        <p className="text-xs text-secondary-light mt-1">{formattedTime}</p>
        {message.loading && loadingIndicator}
      </div>
    </div>
  );
};
