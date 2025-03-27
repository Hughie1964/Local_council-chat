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
      } catch (error: any) {
        console.error(`Error fetching from ${url}:`, error.message || error);
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
    } catch (error: any) {
      console.error('Error scraping from alternative source:', error.message || error);
    }
    
    console.log('No BOE rate found from any source');
    return [];
  } catch (error: any) {
    console.error('Error scraping Bank of England rate:', error.message || error);
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
    console.log('Fetching PWLB rates...');
    
    // Try multiple possible URLs
    const urls = [
      'https://www.dmo.gov.uk/responsibilities/local-authority-lending/current-interest-rates/',
      'https://www.dmo.gov.uk/responsibilities/local-authority-lending-pwlb/interest-rates/',
      'https://www.dmo.gov.uk/data/pdfdatareport?reportCode=D5A'
    ];
    
    let rates: Rate[] = [];
    let lastUpdated = '';
    
    // Try each URL until we find rates
    for (const url of urls) {
      try {
        console.log(`Trying URL for PWLB rates: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        // Try to find last updated date
        const possibleDateSelectors = [
          '.rate-update-date',
          '.last-update',
          '.updated-date',
          'p:contains("Last updated")',
          'div:contains("Last updated")'
        ];
        
        for (const selector of possibleDateSelectors) {
          const dateText = $(selector).first().text().trim();
          if (dateText) {
            // Try to extract a date if it's embedded in text
            const dateMatch = dateText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i) ||
                             dateText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            if (dateMatch) {
              lastUpdated = dateMatch[0];
              break;
            } else {
              lastUpdated = dateText;
              break;
            }
          }
        }
        
        if (!lastUpdated) {
          lastUpdated = new Date().toLocaleDateString('en-GB');
        }
        
        console.log(`PWLB Last Updated date found: ${lastUpdated}`);
        
        // Try different table selectors
        const possibleTableSelectors = [
          '.rate-table',
          'table',
          '.interest-rates-table',
          '.rates-table'
        ];
        
        let foundRates = false;
        
        for (const tableSelector of possibleTableSelectors) {
          const table = $(tableSelector).first();
          if (table.length) {
            console.log(`Found potential PWLB rates table using selector: ${tableSelector}`);
            
            // Try to extract rates from the table
            $(table).find('tr').each((index, row) => {
              if (index === 0) return; // Skip header row
              
              const columns = $(row).find('td');
              if (columns.length >= 2) {
                const loanType = $(columns[0]).text().trim();
                const rate = $(columns[1]).text().trim();
                
                // Check if rate looks like a percentage
                if (loanType && rate && /\d+\.?\d*\s*%/.test(rate)) {
                  rates.push({
                    name: `PWLB ${loanType} Fixed Rate`,
                    value: rate,
                    lastUpdated,
                    source: 'UK Debt Management Office'
                  });
                  foundRates = true;
                }
              }
            });
            
            if (foundRates) {
              console.log(`Successfully extracted ${rates.length} PWLB rates`);
              break;
            }
          }
        }
        
        // If we found rates, break the URL loop
        if (rates.length > 0) {
          break;
        }
        
        // Last resort: try to find any text that looks like rates in the page
        if (rates.length === 0) {
          console.log('Attempting to extract PWLB rates from page text...');
          const bodyText = $('body').text();
          
          // Look for patterns like "5 year: 4.45%"
          const rateMatches = bodyText.match(/(\d+(?:\s+year|\s+yr|\s+y)(?:s)?)\s*:?\s*(\d+\.?\d*\s*%)/gi);
          
          if (rateMatches && rateMatches.length > 0) {
            console.log(`Found ${rateMatches.length} potential PWLB rates in text`);
            
            rateMatches.forEach(match => {
              const parts = match.split(/:\s*/);
              if (parts.length === 2) {
                const loanType = parts[0].trim();
                const rate = parts[1].trim();
                
                rates.push({
                  name: `PWLB ${loanType} Fixed Rate`,
                  value: rate,
                  lastUpdated,
                  source: 'UK Debt Management Office'
                });
              }
            });
          }
        }
      } catch (error: any) {
        console.error(`Error fetching PWLB rates from ${url}:`, error.message || error);
        // Continue to the next URL
      }
    }
    
    // If we found rates, return them
    if (rates.length > 0) {
      // Sort rates by loan term if possible
      rates.sort((a, b) => {
        const termA = parseInt(a.name.match(/\d+/)?.[0] || '999');
        const termB = parseInt(b.name.match(/\d+/)?.[0] || '999');
        return termA - termB;
      });
      
      console.log(`Returning ${rates.length} PWLB rates`);
      return rates;
    }
    
    // If we couldn't find any rates, try an alternative source
    try {
      console.log('Attempting to scrape PWLB rates from alternative source...');
      // Local government association sometimes has PWLB rate information
      const lgaUrl = 'https://www.local.gov.uk/our-support/financial-resilience-and-economic-recovery/financial-management';
      const response = await axios.get(lgaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const bodyText = $('body').text();
      
      // Look for patterns like "PWLB 5 year rate: 4.45%"
      const rateMatches = bodyText.match(/PWLB\s+(\d+(?:\s+year|\s+yr|\s+y)(?:s)?)\s+rate\s*:?\s*(\d+\.?\d*\s*%)/gi);
      
      if (rateMatches && rateMatches.length > 0) {
        console.log(`Found ${rateMatches.length} PWLB rates from alternative source`);
        const altRates: Rate[] = [];
        
        rateMatches.forEach(match => {
          const termMatch = match.match(/PWLB\s+(\d+(?:\s+year|\s+yr|\s+y)(?:s)?)/i);
          const rateMatch = match.match(/(\d+\.?\d*\s*%)/);
          
          if (termMatch && rateMatch) {
            altRates.push({
              name: `PWLB ${termMatch[1]} Fixed Rate`,
              value: rateMatch[1],
              lastUpdated: new Date().toLocaleDateString('en-GB'),
              source: 'Local Government Association'
            });
          }
        });
        
        if (altRates.length > 0) {
          console.log(`Returning ${altRates.length} PWLB rates from alternative source`);
          return altRates;
        }
      }
    } catch (error: any) {
      console.error('Error scraping PWLB rates from alternative source:', error.message || error);
    }
    
    console.log('No PWLB rates found from any source');
    return [];
  } catch (error: any) {
    console.error('Error scraping PWLB rates:', error.message || error);
    // For development, return placeholders clearly marked as development data
    console.log('Returning development PWLB rates');
    return [
      {
        name: 'PWLB 1 Year Fixed Rate',
        value: '4.20%',
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        source: 'UK Debt Management Office (Development Data)'
      },
      {
        name: 'PWLB 5 Year Fixed Rate',
        value: '4.45%',
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        source: 'UK Debt Management Office (Development Data)'
      },
      {
        name: 'PWLB 10 Year Fixed Rate',
        value: '4.63%',
        lastUpdated: new Date().toLocaleDateString('en-GB'),
        source: 'UK Debt Management Office (Development Data)'
      }
    ];
  }
}