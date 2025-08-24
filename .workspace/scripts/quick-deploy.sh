#!/bin/bash

# Quick Deployment Script for Development Iterations
# Usage: ./quick-deploy.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Deploy to Arweave${NC}"
echo "=========================="

cd "$PROJECT_ROOT"

# Check if we have a basic app to deploy
if [[ ! -f "package.json" ]]; then
    echo "❌ No package.json found. Creating basic app structure first..."
    
    # Create a minimal index.html for testing
    mkdir -p dist
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glyph Potluck - Coming Soon</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            text-align: center;
        }
        .container {
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .features {
            text-align: left;
            margin: 30px 0;
        }
        .feature {
            margin: 15px 0;
            padding: 10px 0;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }
        .version {
            font-size: 0.9em;
            opacity: 0.7;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ Glyph Potluck</h1>
        <div class="subtitle">Turn your hand-drawn letters into beautiful fonts</div>
        
        <div class="features">
            <div class="feature">📝 Upload hand-drawn glyph images</div>
            <div class="feature">🎯 Choose vectorization quality (Fast/Balanced/High)</div>
            <div class="feature">🔧 Simple 5-step wizard interface</div>
            <div class="feature">💾 Download TTF/OTF font files</div>
            <div class="feature">🌐 Works entirely in your browser</div>
        </div>
        
        <div class="status">
            <strong>🚧 Under Development</strong><br>
            This app is currently being built. Check back soon for the full experience!
        </div>
        
        <div class="version">
            Deployed on Arweave Permaweb • Version 0.1.0
        </div>
    </div>
    
    <script>
        // Simple deployment test
        console.log('Glyph Potluck - Deployment Test Successful');
        console.log('Deployed at:', new Date().toISOString());
        
        // Test that we can access modern browser APIs we'll need
        const features = {
            'File API': typeof File !== 'undefined',
            'Canvas API': typeof HTMLCanvasElement !== 'undefined',
            'Web Workers': typeof Worker !== 'undefined',
            'LocalStorage': typeof localStorage !== 'undefined'
        };
        
        console.log('Browser compatibility check:', features);
    </script>
</body>
</html>
EOF
    
    echo "✅ Created minimal deployment test page"
fi

# Deploy directly with arkb for maximum speed
echo -e "${GREEN}Deploying to Arweave with arkb...${NC}"
arkb deploy dist --wallet .workspace/config/wallet.json

echo -e "${GREEN}✅ Quick deployment complete!${NC}"
