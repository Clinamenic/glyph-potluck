// Arweave deployment configuration for Glyph Potluck
const path = require('path');

module.exports = {
  // Wallet configuration
  walletPath: path.join(__dirname, 'wallet.json'),
  
  // Build configuration
  buildDir: 'dist',
  buildCommand: 'npm run build',
  
  // Deployment settings
  appName: 'Glyph Potluck',
  description: 'Convert hand-drawn glyphs to vector fonts',
  
  // ArNS configuration (optional)
  arnsName: 'glyph-potluck', // Reserve this name for later
  
  // Tags for discovery
  tags: [
    { name: 'App-Name', value: 'Glyph-Potluck' },
    { name: 'App-Version', value: process.env.npm_package_version || '0.1.0' },
    { name: 'Content-Type', value: 'text/html' },
    { name: 'App-Type', value: 'web-app' },
    { name: 'Category', value: 'font-tools' },
    { name: 'Keywords', value: 'fonts,typography,vector,handwriting' }
  ],
  
  // Deployment options
  options: {
    // Automatically open the deployed app after upload
    openAfterDeploy: true,
    
    // Show verbose output during deployment
    verbose: true,
    
    // Retry failed uploads
    retryAttempts: 3
  }
};
