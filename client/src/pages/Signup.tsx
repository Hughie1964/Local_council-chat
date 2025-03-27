import React from "react";
import { Link } from "wouter";
import SignupForm from "@/components/SignupForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex flex-col">
      <header className="bg-white border-b border-neutral-300 py-3 px-4 shadow-sm">
        <div className="container mx-auto flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
          <h1 className="font-sans font-semibold text-lg text-primary">
            UK Council Money Market | Community Signup
          </h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="hidden lg:flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-primary mb-4">
                Connect with UK Council Finance Professionals
              </h2>
              <p className="text-secondary/80 mb-6">
                Join our exclusive community dedicated to UK local council finance teams. Get access to:
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time financial market data relevant to councils",
                  "AI-powered assistance for treasury management queries",
                  "Discussion forums with other council finance professionals",
                  "Regular updates on PWLB and money market rates",
                  "Educational resources and best practices"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <SignupForm />
            </div>
          </div>
        </div>
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

export default Signup;