import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { RatesPanel } from '@/components/RatesPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, ExternalLinkIcon } from 'lucide-react';
import { format } from 'date-fns';

interface NewsResponse {
  news?: NewsArticle[];
  headlines?: NewsArticle[];
  page: number;
  pageSize: number;
}

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

const DEFAULT_PAGE_SIZE = 6;

export const News: FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [ratesPanelVisible, setRatesPanelVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  
  // Current page state for both news types
  const [economicNewsPage, setEconomicNewsPage] = useState(1);
  const [headlinesPage, setHeadlinesPage] = useState(1);
  
  // Fetch economic news
  const { 
    data: economicNewsData, 
    isLoading: isLoadingEconomic,
    error: economicError
  } = useQuery<NewsResponse>({
    queryKey: ['/api/news/economic', economicNewsPage, DEFAULT_PAGE_SIZE],
    queryFn: () => apiRequest<NewsResponse>(`/api/news/economic?page=${economicNewsPage}&pageSize=${DEFAULT_PAGE_SIZE}`),
    enabled: true
  });

  // Fetch financial headlines
  const { 
    data: headlinesData, 
    isLoading: isLoadingHeadlines,
    error: headlinesError
  } = useQuery<NewsResponse>({
    queryKey: ['/api/news/headlines', headlinesPage, DEFAULT_PAGE_SIZE],
    queryFn: () => apiRequest<NewsResponse>(`/api/news/headlines?page=${headlinesPage}&pageSize=${DEFAULT_PAGE_SIZE}`),
    enabled: true
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleRatesPanel = () => {
    setRatesPanelVisible(!ratesPanelVisible);
  };

  // Format the date for display
  const formatPublishedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.M.yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  // Create pagination controls
  const renderPagination = (
    currentPage: number, 
    setPage: (page: number) => void,
    isLoading: boolean
  ) => {
    return (
      <div className="flex justify-center mt-6 mb-8">
        <Pagination>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(currentPage + 1)}
            disabled={isLoading}
          >
            Next
          </Button>
        </Pagination>
      </div>
    );
  };

  // Render a news article card
  const renderNewsCard = (article: NewsArticle, index: number) => {
    return (
      <Card key={index} className="mb-4 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-2">{article.title}</CardTitle>
              <CardDescription className="flex items-center text-xs mt-2">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formatPublishedDate(article.publishedAt)}
                {article.source.name && (
                  <>
                    <span className="mx-2">•</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {article.source.name}
                    </Badge>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {article.urlToImage && (
            <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
              <img 
                src={article.urlToImage} 
                alt={article.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="text-sm line-clamp-3">{article.description}</p>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between">
          <div className="flex-1" />
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center"
          >
            <Button variant="outline" size="sm" className="gap-1">
              Read Full Article
              <ExternalLinkIcon className="h-3 w-3" />
            </Button>
          </a>
        </CardFooter>
      </Card>
    );
  };

  // Render loading skeleton
  const renderSkeleton = () => {
    return Array(DEFAULT_PAGE_SIZE).fill(0).map((_, i) => (
      <Card key={i} className="mb-4">
        <CardHeader>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[120px] w-full mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-32 ml-auto" />
        </CardFooter>
      </Card>
    ));
  };

  // Render error state
  const renderError = (message: string) => (
    <Card className="mb-4 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Error Loading News</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        visible={sidebarVisible} 
        setCurrentSessionId={setCurrentSessionId}
        currentSessionId={currentSessionId}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          toggleRatesPanel={toggleRatesPanel}
        />
        
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">UK Financial News</h1>
              <p className="text-muted-foreground mt-1">
                Stay updated on the latest UK economic developments and financial headlines
              </p>
              <Separator className="my-4" />
            </div>

            <Tabs defaultValue="economic">
              <TabsList className="mb-4">
                <TabsTrigger value="economic">UK Economic News</TabsTrigger>
                <TabsTrigger value="headlines">Financial Headlines</TabsTrigger>
              </TabsList>
              
              <TabsContent value="economic" className="mt-0">
                <ScrollArea className="pr-4">
                  {isLoadingEconomic ? (
                    renderSkeleton()
                  ) : economicError ? (
                    renderError("Failed to load economic news. Please try again later.")
                  ) : (
                    <>
                      {economicNewsData && economicNewsData.news && economicNewsData.news.length > 0 ? (
                        <>
                          {economicNewsData.news.map((article: NewsArticle, index: number) => (
                            renderNewsCard(article, index)
                          ))}
                        </>
                      ) : (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">No economic news available.</p>
                          </CardContent>
                        </Card>
                      )}
                      {renderPagination(economicNewsPage, setEconomicNewsPage, isLoadingEconomic)}
                    </>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="headlines" className="mt-0">
                <ScrollArea className="pr-4">
                  {isLoadingHeadlines ? (
                    renderSkeleton()
                  ) : headlinesError ? (
                    renderError("Failed to load financial headlines. Please try again later.")
                  ) : (
                    <>
                      {headlinesData && headlinesData.headlines && headlinesData.headlines.length > 0 ? (
                        <>
                          {headlinesData.headlines.map((article: NewsArticle, index: number) => (
                            renderNewsCard(article, index)
                          ))}
                        </>
                      ) : (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">No financial headlines available.</p>
                          </CardContent>
                        </Card>
                      )}
                      {renderPagination(headlinesPage, setHeadlinesPage, isLoadingHeadlines)}
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Rates Panel */}
      <RatesPanel />
    </div>
  );
};

export default News;