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
            className={`w-full border ${isListening ? 'border-primary' : 'border-neutral-300'} rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200`}
            placeholder={isListening ? "Listening to your voice..." : "Type your money market query here..."}
          />
          {speechSupported && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={toggleListening}
              className={`absolute right-3 top-2.5 ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400 hover:text-primary'}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
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
        {speechSupported ? (
          <>
            This advisory service provides general information and analysis for council officers. 
            <span className="block mt-1">Click the microphone icon to use voice commands.</span>
          </>
        ) : (
          <>
            This advisory service provides general information and analysis for council officers. 
            Always consult with your Section 151 Officer before making financial decisions.
          </>
        )}
      </div>
    </div>
  );
};
