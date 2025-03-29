import { FC } from "react";
import { Message, FeatureRequest } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { 
  Brain, 
  User, 
  Calendar, 
  FileText, 
  TrendingUp, 
  RefreshCw, 
  DollarSign 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Message;
  onFeatureAction?: (feature: string, action: string, params?: Record<string, any>) => void;
}

export const ChatMessage: FC<ChatMessageProps> = ({ message, onFeatureAction }) => {
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

  // Check if message.content exists before processing
  const contentWithHtml = message.content 
    ? message.content.replace(/\n/g, "<br>")
    : message.isMaturityReminder 
      ? message.content 
      : "Message content unavailable";
  
  // Handle tables with a simple solution that doesn't use the 's' flag
  const tableFormattedContent = contentWithHtml && typeof contentWithHtml === 'string'
    ? contentWithHtml.replace(
        /<table([^>]*)>([\s\S]*?)<\/table>/g,
        (match) => `<div class="bg-white rounded-md border border-neutral-300 p-2 my-2 overflow-auto">${match}</div>`
      )
    : contentWithHtml;

  // Function to render feature cards for professional features
  const renderFeatureCard = (featureRequest: FeatureRequest) => {
    // Choose the appropriate icon based on the feature type
    const getFeatureIcon = () => {
      switch (featureRequest.feature) {
        case 'calendar':
          return <Calendar className="h-5 w-5" />;
        case 'documents':
          return <FileText className="h-5 w-5" />;
        case 'forecasting':
          return <TrendingUp className="h-5 w-5" />;
        case 'trades':
          return <RefreshCw className="h-5 w-5" />;
        case 'quotes':
          return <DollarSign className="h-5 w-5" />;
        default:
          return <Brain className="h-5 w-5" />;
      }
    };

    // Choose the appropriate title based on the feature type
    const getFeatureTitle = () => {
      switch (featureRequest.feature) {
        case 'calendar':
          return "Financial Calendar";
        case 'documents':
          return "Document Management";
        case 'forecasting':
          return "Financial Forecasting";
        case 'trades':
          return "Trade Management";
        case 'quotes':
          return "Quote Requests";
        default:
          return "Feature";
      }
    };

    // Choose the appropriate action button text
    const getActionText = () => {
      switch (featureRequest.action) {
        case 'view':
          return "View";
        case 'create':
          return "Create";
        case 'update':
          return "Update";
        case 'delete':
          return "Delete";
        case 'analyze':
          return "Analyze";
        case 'execute':
          return "Execute";
        default:
          return "Open";
      }
    };

    // Handle action button click
    const handleActionClick = () => {
      if (onFeatureAction) {
        onFeatureAction(
          featureRequest.feature,
          featureRequest.action,
          featureRequest.params
        );
      }
    };

    // Handle dismiss button click
    const handleDismissClick = () => {
      // Just dismiss the card (no action needed as we're not modifying the message)
      // We could notify the parent if this becomes necessary
    };

    return (
      <Card className="p-4 mt-2 border border-primary/30 bg-primary/5">
        <div className="flex items-center mb-2">
          <div className="p-2 rounded-full bg-primary/10 mr-2">
            {getFeatureIcon()}
          </div>
          <h4 className="font-medium">{getFeatureTitle()}</h4>
        </div>
        <p className="text-sm mb-3">{featureRequest.message}</p>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="default"
            className="flex items-center space-x-1"
            onClick={handleActionClick}
          >
            {getFeatureIcon()} <span>{getActionText()} {getFeatureTitle()}</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDismissClick}
          >
            Dismiss
          </Button>
        </div>
      </Card>
    );
  };

  // Check if this message has a feature request
  const hasFeatureRequest = message.featureRequest && !message.isUser;

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
        
        {/* Feature Request Card */}
        {hasFeatureRequest && renderFeatureCard(message.featureRequest!)}
        
        <p className="text-xs text-muted-foreground/80 mt-2">{formattedTime}</p>
        {message.loading && loadingIndicator}
      </div>
    </div>
  );
};
