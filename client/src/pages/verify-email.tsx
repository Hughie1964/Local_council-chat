import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Extract token from URL
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    if (!token) {
      setVerifying(false);
      setSuccess(false);
      setErrorMessage("No verification token provided.");
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        const response = await apiRequest("GET", `/api/verify-email?token=${token}`);
        const data = await response.json();
        
        setVerifying(false);
        setSuccess(data.success);
        
        if (!data.success) {
          setErrorMessage(data.message || "Failed to verify email. The link may have expired.");
        }
      } catch (error) {
        setVerifying(false);
        setSuccess(false);
        setErrorMessage("An error occurred while verifying your email.");
        console.error("Verification error:", error);
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">Email Verification</CardTitle>
          <CardDescription className="text-center">
            Confirming your email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {verifying ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">Verifying your email address...</p>
            </div>
          ) : success ? (
            <Alert className="bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your email has been successfully verified. You can now access all features of the platform.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50">
              <XCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-800">Verification Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation("/auth")} 
            disabled={verifying}
            className="w-full"
          >
            {success ? "Go to Login" : "Back to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}