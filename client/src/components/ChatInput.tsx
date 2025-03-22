import { FC, useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Paperclip, SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isError: boolean;
  errorMessage: string;
  resetError: () => void;
}

export const ChatInput: FC<ChatInputProps> = ({ 
  onSendMessage, 
  isError, 
  errorMessage,
  resetError
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Reset error on message change
  useEffect(() => {
    if (isError && message) {
      resetError();
    }
  }, [message, isError, resetError]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    onSendMessage(trimmedMessage);
    setMessage("");
  };

  return (
    <div className="border-t border-neutral-300 bg-white p-4">
      {isError && (
        <Alert variant="destructive" className="bg-red-500/10 text-red-600 text-sm p-2 rounded-md mb-2">
          <AlertCircle className="h-5 w-5 mr-1" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input 
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            placeholder="Type your money market query here..."
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-primary"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>
        <Button 
          type="submit" 
          size="icon"
          className="bg-primary hover:bg-primary/90 text-white rounded-lg p-3 transition-colors"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>

      <div className="mt-2 text-xs text-center text-secondary/70">
        This advisory service provides general information and analysis for council officers. 
        Always consult with your Section 151 Officer before making financial decisions.
      </div>
    </div>
  );
};
