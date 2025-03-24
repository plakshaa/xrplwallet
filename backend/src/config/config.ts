// Environment configuration
export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trustpay',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'trustpay_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Blockchain configuration
  blockchain: {
    // XRPL configuration
    xrpl: {
      server: process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233',
    },
    // Ethereum configuration
    ethereum: {
      rpcUrl: process.env.ETH_RPC_URL || 'https://goerli.infura.io/v3/your-infura-id',
    },
  },
  
  // Crypto exchange API configuration
  exchangeApi: {
    baseUrl: process.env.EXCHANGE_API_URL || 'https://api.coingecko.com/api/v3',
    apiKey: process.env.EXCHANGE_API_KEY || '',
  },
}; 