import { FC, useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mic, MicOff, SendHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Add TypeScript interfaces for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    // Check for special test commands (these are just for testing feature cards)
    if (trimmedMessage.startsWith('/feature')) {
      const parts = trimmedMessage.split(' ');
      if (parts.length >= 2) {
        const featureType = parts[1].toLowerCase();
        const action = parts.length >= 3 ? parts[2].toLowerCase() : 'view';
        
        // Create a feature request JSON message that mimics what would come from the server
        const featureRequestJson = {
          isFeatureRequest: true,
          feature: featureType,
          action: action,
          params: {},
          message: `Here are the ${featureType} options you requested.`
        };
        
        // Send this as a special formatted message
        onSendMessage(JSON.stringify(featureRequestJson));
      } else {
        // Show help for feature commands
        toast({
          title: "Feature Command Help",
          description: "Usage: /feature [type] [action]. Example: /feature calendar view"
        });
      }
    } else {
      // Regular message handling
      onSendMessage(trimmedMessage);
    }
    
    setMessage("");
  };

  return (
    <div className="border-t bg-background/80 backdrop-blur-sm p-4">
      {isError && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-2">
          <AlertCircle className="h-5 w-5 mr-1" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {isListening && (
        <div className="bg-primary/10 text-primary text-sm p-2 rounded-md mb-2 flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          <span>Listening to your voice... Speak clearly.</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input 
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full gradient-border ${isListening ? 'border-primary' : 'border-primary/30'} rounded-lg py-3 pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-primary transition-colors duration-200`}
            placeholder={isListening ? "Listening to your voice..." : "Type your money market query here..."}
          />
          {speechSupported && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={toggleListening}
              className={`absolute right-3 top-2.5 ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
        <Button 
          type="submit" 
          size="icon"
          className="bg-gradient-to-tr from-primary to-primary/80 hover:bg-primary/90 text-primary-foreground rounded-lg p-3 transition-all hover:shadow-md"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>

      <div className="mt-2 text-xs text-center text-muted-foreground">
        {speechSupported ? (
          <>
            This advisory service provides general information and analysis for council officers. 
            <span className="block mt-1">Click the microphone icon to use voice commands.</span>
            <span className="block mt-1 text-primary">Tip: Try "/feature calendar" or "/feature documents" for quick access to features.</span>
          </>
        ) : (
          <>
            This advisory service provides general information and analysis for council officers. 
            Always consult with your Section 151 Officer before making financial decisions.
            <span className="block mt-1 text-primary">Tip: Try "/feature calendar" or "/feature documents" for quick access to features.</span>
          </>
        )}
      </div>
    </div>
  );
};
