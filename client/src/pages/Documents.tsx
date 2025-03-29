import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Link } from 'wouter';

export default function Documents() {
  const [documentTab, setDocumentTab] = useState<string>("council");
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-4 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
      </div>
      
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8"
          />
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
      
      <Tabs defaultValue="council" onValueChange={setDocumentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="council">Council Documents</TabsTrigger>
          <TabsTrigger value="personal">My Documents</TabsTrigger>
          <TabsTrigger value="shared">Shared With Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="council" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle>Council Documents</CardTitle>
              </div>
              <CardDescription>
                Access official council documents, policies, and financial resources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* This would be populated with actual documents from the API */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-medium text-sm">
                              {["Treasury Management Policy", "Annual Financial Report", "PWLB Loan Application", "Risk Management Guidelines", "Investment Strategy", "Financial Controls"][i % 6]}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Updated {["2 days ago", "1 week ago", "3 weeks ago", "1 month ago", "2 months ago", "3 months ago"][i % 6]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardFooter className="p-3 bg-muted/50 flex justify-between">
                      <div className="text-xs">PDF • 2.{i+1} MB</div>
                      <Button variant="ghost" size="sm" className="h-8 px-2">View</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle>My Documents</CardTitle>
              </div>
              <CardDescription>
                Documents you've created or uploaded to the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* This would be populated with user's personal documents from the API */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-medium text-sm">
                              {["Budget Projections 2025", "Trade Analysis Q1", "Cash Flow Model"][i % 3]}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Updated {["2 days ago", "1 week ago", "2 weeks ago"][i % 3]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardFooter className="p-3 bg-muted/50 flex justify-between">
                      <div className="text-xs">{["XLSX", "PDF", "XLSX"][i % 3]} • 1.{i+1} MB</div>
                      <div className="space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2">Share</Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">View</Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shared" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle>Shared With Me</CardTitle>
              </div>
              <CardDescription>
                Documents shared with you by other users or councils.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* This would be populated with shared documents from the API */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-medium text-sm">
                              {["Inter-Council Lending Proposal", "Joint Investment Strategy"][i % 2]}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Shared by {["Manchester City Council", "Leeds City Council"][i % 2]} • {["3 days ago", "1 week ago"][i % 2]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardFooter className="p-3 bg-muted/50 flex justify-between">
                      <div className="text-xs">{["DOCX", "PDF"][i % 2]} • 3.{i+1} MB</div>
                      <Button variant="ghost" size="sm" className="h-8 px-2">View</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}