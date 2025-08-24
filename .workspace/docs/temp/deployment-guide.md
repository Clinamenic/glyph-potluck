# Arweave Deployment Guide - Glyph Potluck

## Overview

This guide covers the streamlined deployment framework for rapid iteration during Glyph Potluck development. The system uses **permaweb-deploy** for efficient uploads to Arweave with your funded wallet.

## Quick Start

### Immediate Deployment (for testing)
```bash
npm run deploy:quick
```
This creates a minimal test page and deploys it immediately.

### Development Deployments
```bash
npm run deploy:dev
```
Deploys the current build with development tags.

### Production Deployments
```bash
npm run deploy
```
Deploys with production tags (includes confirmation prompt).

## Deployment Framework Components

### 1. Tools & Dependencies
- **arkb**: Simple CLI tool for Arweave uploads (installed globally)
- **Wallet**: Your funded Arweave wallet at `.workspace/config/wallet.json`
- **Build System**: Vite for optimized static builds

### 2. Scripts & Configuration

#### Main Deployment Script
**Location**: `.workspace/scripts/deploy-to-arweave.sh`

**Features**:
- Wallet balance checking
- Automated building
- Cost estimation
- Deployment with proper tags
- Transaction ID tracking
- Browser auto-opening
- Deployment history logging

**Usage**:
```bash
# Production deployment (with confirmation)
./.workspace/scripts/deploy-to-arweave.sh --prod

# Development deployment (no confirmation)
./.workspace/scripts/deploy-to-arweave.sh --dev
```

#### Quick Deploy Script
**Location**: `.workspace/scripts/quick-deploy.sh`

**Purpose**: Rapid testing during development
- Creates minimal test page if no app exists
- Immediate deployment without prompts
- Perfect for testing deployment pipeline

#### Configuration
**Location**: `.workspace/config/deploy.config.js`

Contains deployment settings, tags, and options.

### 3. Deployment Tags

Each deployment includes metadata tags for discovery:

```javascript
{
  'App-Name': 'Glyph-Potluck',
  'App-Version': '0.1.0',
  'Content-Type': 'text/html',
  'App-Type': 'web-app',
  'Category': 'font-tools',
  'Keywords': 'fonts,typography,vector,handwriting',
  'Environment': 'development' | 'production'
}
```

## Development Workflow

### Typical Iteration Cycle

1. **Develop Features**
   ```bash
   npm run dev  # Local development server
   ```

2. **Test Build**
   ```bash
   npm run build    # Create production build
   npm run preview  # Test built version locally
   ```

3. **Deploy for Testing**
   ```bash
   npm run deploy:dev  # Quick dev deployment
   ```

4. **Production Release**
   ```bash
   npm run deploy  # Production deployment (with confirmation)
   ```

### Deployment Outputs

After successful deployment, you'll receive:

- **Transaction ID**: Unique identifier for the deployment
- **Arweave URL**: `https://arweave.net/{tx-id}`
- **Gateway URL**: `https://{tx-id}.arweave.net` (easier to share)

**Example Output**:
```
Files deployed! Visit the following URL to see your deployed content:
https://arweave.net/k1Amo9UdjWAWbLG8YkCZhziSkg71aAb1Wkb7ULj1PEc

✅ Quick deployment complete!
```

## Cost & Performance

### Deployment Costs
- **Typical app bundle**: ~1-2 MB = ~$0.001-0.002 USD
- **With assets**: ~5-10 MB = ~$0.005-0.010 USD
- **Your wallet**: Pre-funded for many deployments

### Performance Optimization
- **Vite bundling**: Optimized builds with code splitting
- **Asset inlining**: Single-file deployment when needed
- **Compression**: Automatic gzip compression
- **Caching**: Browser caching with proper headers

## Deployment History

Deployments are tracked in `.workspace/config/deployments.json` with:
- Timestamp
- Version
- Environment (dev/prod)
- Transaction ID
- URLs

## Troubleshooting

### Common Issues

#### 1. Wallet Balance
```bash
# Check balance manually
arkb balance .workspace/config/wallet.json
```

#### 2. Build Failures
```bash
# Clean and rebuild
npm run clean
npm run build
```

#### 3. Deployment Timeout
The script includes retry logic and verbose output for debugging.

#### 4. Permission Issues
```bash
# Make scripts executable
chmod +x .workspace/scripts/*.sh
```

### Debug Mode
Add `--verbose` to any arkb command for detailed output.

## Advanced Features

### Future Enhancements
Based on the web search results, we can later integrate:

1. **Arlink Integration**: GitHub-based auto-deployments
2. **ArNS Setup**: Human-readable domain names
3. **CI/CD Pipeline**: Automated deployments via GitHub Actions

### ArNS Integration (Future)
Reserve a name like `glyph-potluck.arweave.dev` for easier access.

## Security Notes

- **Wallet Security**: Never commit wallet to public repositories
- **Environment Variables**: Consider using environment variables for production
- **Access Control**: Wallet file has restricted permissions

---

*This deployment framework enables rapid iteration while maintaining professional deployment practices for the Arweave permaweb.*
