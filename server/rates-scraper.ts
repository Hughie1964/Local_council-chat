import axios from 'axios';
import * as cheerio from 'cheerio';

interface Rate {
  name: string;
  value: string;
  lastUpdated: string;
  source: string;
}

/**
 * Scrapes current UK money market rates from official sources
 * This includes PWLB rates, Bank of England rates, etc.
 */
export async function scrapeUKRates(): Promise<Rate[]> {
  try {
    // This is a placeholder for actual implementation
    // In a production environment, we would scrape from official sources
    console.log('Attempting to scrape UK money market rates');
    
    const rates: Rate[] = await Promise.all([
      scrapeBankOfEnglandBaseRate(),
      scrapePWLBRates()
    ]).then(results => results.flat());
    
    return rates;
  } catch (error) {
    console.error('Error scraping rates:', error);
    return [];
  }
}

/**
 * Scrapes the Bank of England base rate
 */
async function scrapeBankOfEnglandBaseRate(): Promise<Rate[]> {
  try {
    console.log('Fetching Bank of England base rate...');
    
    // Try multiple possible URLs
    const urls = [
      'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate',
      'https://www.bankofengland.co.uk/monetary-policy'
    ];
    
    let rateText = '';
    let lastUpdatedText = '';
    let $ = null;
    
    // Try each URL until we find the rate
    for (const url of urls) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        $ = cheerio.load(response.data);
        
        // Try multiple possible selectors for the rate
        const possibleRateSelectors = [
          '.interest-rate-panel__rate-value',
          '.rate-value',
          '.bank-rate__value',
          '.bank-rate',
          '.current-bank-rate',
          'h2:contains("Bank Rate")',
          'strong:contains("%")'
        ];
        
        for (const selector of possibleRateSelectors) {
          const element = $(selector).first();
          if (element.length) {
            rateText = element.text().trim();
            // If we found text that contains a percentage, clean it up
            if (rateText.includes('%')) {
              rateText = rateText.match(/\d+\.?\d*\s*%/)?.[0] || rateText;
              break;
            }
          }
        }
        
        // If we found the rate, look for the date
        if (rateText) {
          const possibleDateSelectors = [
            '.interest-rate-panel__date',
            '.rate-date',
            '.bank-rate__date',
            '.updated-date',
            'p:contains("effective from")',
            'span:contains("effective from")'
          ];
          
          for (const selector of possibleDateSelectors) {
            const element = $(selector).first();
            if (element.length) {
              lastUpdatedText = element.text().trim();
              // Try to extract a date if it's embedded in text
              const dateMatch = lastUpdatedText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i);
              if (dateMatch) {
                lastUpdatedText = dateMatch[0];
              }
              break;
            }
          }
          
          break; // Break the URL loop if we found the rate
        }
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error.message);
        // Continue to the next URL
      }
    }
    
    console.log(`Found BOE rate: ${rateText}, last updated: ${lastUpdatedText}`);
    
    // If we found a rate, return it
    if (rateText) {
      return [{
        name: 'Bank of England Base Rate',
        value: rateText,
        lastUpdated: lastUpdatedText || new Date().toLocaleDateString('en-GB'),
        source: 'Bank of England'
      }];
    }
    
    // Fallback approach: Parse the HTML for any text that looks like a rate
    if ($) {
      console.log('Using fallback approach to find BOE rate');
      const bodyText = $('body').text();
      const rateRegex = /bank\s+rate\s+is\s+(\d+\.?\d*%)/i;
      const rateMatch = bodyText.match(rateRegex);
      
      if (rateMatch && rateMatch[1]) {
        console.log(`Found BOE rate via text parsing: ${rateMatch[1]}`);
        return [{
          name: 'Bank of England Base Rate',
          value: rateMatch[1],
          lastUpdated: new Date().toLocaleDateString('en-GB'),
          source: 'Bank of England'
        }];
      }
    }
    
    // If all else fails, scrape from another reliable source
    try {
      console.log('Attempting to scrape BOE rate from alternative source...');
      const tradingEconomicsUrl = 'https://tradingeconomics.com/united-kingdom/interest-rate';
      const response = await axios.get(tradingEconomicsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const rateText = $('#ctl00_ContentPlaceHolder1_ctl00_IndicatorHeader1_LblIndicatorValue').text().trim();
      
      if (rateText && rateText.includes('%')) {
        console.log(`Found BOE rate from Trading Economics: ${rateText}`);
        return [{
          name: 'Bank of England Base Rate',
          value: rateText,
          lastUpdated: new Date().toLocaleDateString('en-GB'),
          source: 'Trading Economics'
        }];
      }
    } catch (error) {
      console.error('Error scraping from alternative source:', error.message);
    }
    
    console.log('No BOE rate found from any source');
    return [];
  } catch (error) {
    console.error('Error scraping Bank of England rate:', error);
    // For development, return a placeholder, but clearly mark it as development data
    return [{
      name: 'Bank of England Base Rate',
      value: '5.25%',
      lastUpdated: new Date().toLocaleDateString('en-GB'),
      source: 'Bank of England (Development Data)'
    }];
  }
}

/**
 * Scrapes PWLB (Public Works Loan Board) rates
 */
async function scrapePWLBRates(): Promise<Rate[]> {
  try {
    // The UK Debt Management Office publishes PWLB rates
    const url = 'https://www.dmo.gov.uk/responsibilities/local-authority-lending/current-interest-rates/';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // These selectors will need to be updated based on the actual structure
    const rates: Rate[] = [];
    const lastUpdated = $('.rate-update-date').first().text().trim() || new Date().toLocaleDateString('en-GB');
    
    // Extract different loan types (1 year, 5 year, etc.)
    $('.rate-table tr').each((index, row) => {
      if (index === 0) return; // Skip header row
      
      const columns = $(row).find('td');
      if (columns.length >= 2) {
        const loanType = $(columns[0]).text().trim();
        const rate = $(columns[1]).text().trim();
        
        if (loanType && rate) {
          rates.push({
            name: `PWLB ${loanType} Fixed Rate`,
            value: rate,
            lastUpdated,
            source: 'UK Debt Management Office'
          });
        }
      }
    });
    
    return rates;
  } catch (error) {
    console.error('Error scraping PWLB rates:', error);
    // Fallback for development/demo purposes
    return [
      {
        name: 'PWLB 1 Year Fixed Rate',
        value: '4.20%',
        lastUpdated: '21 March 2025',
        source: 'UK Debt Management Office (Demo Data)'
      },
      {
        name: 'PWLB 5 Year Fixed Rate',
        value: '4.45%',
        lastUpdated: '21 March 2025',
        source: 'UK Debt Management Office (Demo Data)'
      },
      {
        name: 'PWLB 10 Year Fixed Rate',
        value: '4.63%',
        lastUpdated: '21 March 2025',
        source: 'UK Debt Management Office (Demo Data)'
      }
    ];
  }
}