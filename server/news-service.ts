import axios from 'axios';

export interface NewsArticle {
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

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * Fetches the latest UK economic and financial news
 */
export async function fetchUKEconomicNews(page: number = 1, pageSize: number = 10): Promise<NewsArticle[]> {
  try {
    if (!NEWS_API_KEY) {
      console.error('NewsAPI key not found in environment variables');
      return [];
    }

    // Economic and financial keywords related to UK economy
    const keywords = [
      'UK economy',
      'British economy',
      'Bank of England',
      'UK interest rates',
      'UK inflation',
      'UK GDP',
      'UK treasury',
      'British pound',
      'UK financial markets',
      'UK budget',
      'UK government spending',
      'UK public sector',
      'UK local council finance',
      'PWLB rates',
      'UK public finance'
    ].join(' OR ');

    const response = await axios.get<NewsResponse>(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        q: keywords,
        language: 'en',
        sortBy: 'publishedAt',
        page,
        pageSize,
        apiKey: NEWS_API_KEY
      }
    });

    if (response.data.status !== 'ok') {
      console.error('Error fetching news:', response.data);
      return [];
    }

    return response.data.articles;
  } catch (error) {
    console.error('Error fetching UK economic news:', error);
    return [];
  }
}

/**
 * Fetches top headlines from UK financial sources
 */
export async function fetchUKFinancialHeadlines(page: number = 1, pageSize: number = 10): Promise<NewsArticle[]> {
  try {
    if (!NEWS_API_KEY) {
      console.error('NewsAPI key not found in environment variables');
      return [];
    }

    // List of UK financial news sources
    const sources = [
      'financial-times',
      'the-economist',
      'business-insider-uk',
      'reuters',
      'bloomberg'
    ].join(',');

    const response = await axios.get<NewsResponse>(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        sources,
        country: 'gb',
        category: 'business',
        page,
        pageSize,
        apiKey: NEWS_API_KEY
      }
    });

    if (response.data.status !== 'ok') {
      console.error('Error fetching headlines:', response.data);
      return [];
    }

    return response.data.articles;
  } catch (error) {
    console.error('Error fetching UK financial headlines:', error);
    return [];
  }
}