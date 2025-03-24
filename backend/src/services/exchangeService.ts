import axios from 'axios';
import { config } from '../config/config';
import { CryptocurrencyType } from '../models/Wallet';

// Define exchange error class
export class ExchangeError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ExchangeError';
  }
}

// Map our cryptocurrency types to CoinGecko IDs
const cryptoIdMap: Record<CryptocurrencyType, string> = {
  [CryptocurrencyType.XRP]: 'ripple',
  [CryptocurrencyType.ETH]: 'ethereum',
  [CryptocurrencyType.BTC]: 'bitcoin',
  [CryptocurrencyType.USDT]: 'tether',
  [CryptocurrencyType.USDC]: 'usd-coin',
};

// Service for cryptocurrency exchange rates
export class ExchangeService {
  // Get current price for a cryptocurrency in a given fiat currency
  static async getCryptoPrice(
    cryptoType: CryptocurrencyType,
    fiatCurrency: string = 'usd'
  ): Promise<number> {
    try {
      const cryptoId = cryptoIdMap[cryptoType];
      
      if (!cryptoId) {
        throw new ExchangeError(`Unsupported cryptocurrency type: ${cryptoType}`, 400);
      }
      
      const apiUrl = `${config.exchangeApi.baseUrl}/simple/price`;
      
      const response = await axios.get(apiUrl, {
        params: {
          ids: cryptoId,
          vs_currencies: fiatCurrency.toLowerCase(),
          ...(config.exchangeApi.apiKey ? { x_cg_pro_api_key: config.exchangeApi.apiKey } : {}),
        },
      });
      
      if (!response.data || !response.data[cryptoId] || !response.data[cryptoId][fiatCurrency.toLowerCase()]) {
        throw new ExchangeError(`Failed to get price for ${cryptoType} in ${fiatCurrency}`, 500);
      }
      
      return response.data[cryptoId][fiatCurrency.toLowerCase()];
    } catch (error) {
      if (error instanceof ExchangeError) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new ExchangeError(
          `Exchange API error: ${error.response?.data?.error || error.message}`,
          error.response?.status || 500
        );
      }
      throw new Error(`Get crypto price failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Convert amount from one cryptocurrency to another
  static async convertCrypto(
    fromCrypto: CryptocurrencyType,
    toCrypto: CryptocurrencyType,
    amount: number
  ): Promise<{ convertedAmount: number; exchangeRate: number }> {
    try {
      // If the same cryptocurrency, no conversion needed
      if (fromCrypto === toCrypto) {
        return {
          convertedAmount: amount,
          exchangeRate: 1,
        };
      }
      
      // Get prices in USD for both cryptocurrencies
      const fromPrice = await ExchangeService.getCryptoPrice(fromCrypto, 'usd');
      const toPrice = await ExchangeService.getCryptoPrice(toCrypto, 'usd');
      
      // Calculate exchange rate and converted amount
      const exchangeRate = fromPrice / toPrice;
      const convertedAmount = amount * exchangeRate;
      
      return {
        convertedAmount,
        exchangeRate,
      };
    } catch (error) {
      if (error instanceof ExchangeError) {
        throw error;
      }
      throw new Error(`Convert crypto failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Convert crypto amount to fiat
  static async cryptoToFiat(
    cryptoType: CryptocurrencyType,
    amount: number,
    fiatCurrency: string = 'usd'
  ): Promise<{ fiatAmount: number; exchangeRate: number }> {
    try {
      const price = await ExchangeService.getCryptoPrice(cryptoType, fiatCurrency);
      
      return {
        fiatAmount: amount * price,
        exchangeRate: price,
      };
    } catch (error) {
      if (error instanceof ExchangeError) {
        throw error;
      }
      throw new Error(`Convert crypto to fiat failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Convert fiat amount to crypto
  static async fiatToCrypto(
    fiatCurrency: string,
    amount: number,
    cryptoType: CryptocurrencyType
  ): Promise<{ cryptoAmount: number; exchangeRate: number }> {
    try {
      const price = await ExchangeService.getCryptoPrice(cryptoType, fiatCurrency);
      
      return {
        cryptoAmount: amount / price,
        exchangeRate: price,
      };
    } catch (error) {
      if (error instanceof ExchangeError) {
        throw error;
      }
      throw new Error(`Convert fiat to crypto failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 