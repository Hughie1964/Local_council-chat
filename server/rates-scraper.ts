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
    const url = 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // This selector may need to be updated based on the website structure
    const rateText = $('.interest-rate-panel__rate-value').first().text().trim();
    const lastUpdatedText = $('.interest-rate-panel__date').first().text().trim();
    
    if (rateText) {
      return [{
        name: 'Bank of England Base Rate',
        value: rateText,
        lastUpdated: lastUpdatedText || new Date().toLocaleDateString('en-GB'),
        source: 'Bank of England'
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error scraping Bank of England rate:', error);
    // Fallback for development/demo purposes
    return [{
      name: 'Bank of England Base Rate',
      value: '5.25%',
      lastUpdated: '21 March 2025',
      source: 'Bank of England (Demo Data)'
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