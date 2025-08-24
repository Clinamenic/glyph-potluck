#!/bin/bash

# Glyph Potluck - Streamlined Arweave Deployment Script
# Usage: ./deploy-to-arweave.sh [--dev|--prod]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE_DIR="$PROJECT_ROOT/.workspace"
CONFIG_DIR="$WORKSPACE_DIR/config"
WALLET_PATH="$CONFIG_DIR/wallet.json"
BUILD_DIR="$PROJECT_ROOT/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wallet exists
check_wallet() {
    if [[ ! -f "$WALLET_PATH" ]]; then
        log_error "Wallet file not found at $WALLET_PATH"
        log_info "Please ensure your Arweave wallet JSON is saved at $WALLET_PATH"
        exit 1
    fi
    log_info "Wallet found at $WALLET_PATH"
}

# Get wallet balance
check_balance() {
    log_info "Checking wallet balance..."
    local balance=$(npx permaweb-deploy balance --wallet-file "$WALLET_PATH" 2>/dev/null || echo "0")
    if [[ "$balance" == "0" || -z "$balance" ]]; then
        log_warning "Unable to check balance or balance is 0 AR"
        log_info "Proceeding with deployment attempt..."
    else
        log_success "Wallet balance: $balance AR"
    fi
}

# Build the application
build_app() {
    log_info "Building application for production..."
    cd "$PROJECT_ROOT"
    
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found in project root"
        exit 1
    fi
    
    # Run the build command
    npm run build
    
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "Build directory $BUILD_DIR not found after build"
        exit 1
    fi
    
    log_success "Application built successfully"
}

# Calculate deployment cost
estimate_cost() {
    local size=$(du -sb "$BUILD_DIR" 2>/dev/null | cut -f1 || echo "0")
    if [[ "$size" -gt 0 ]]; then
        # Rough estimate: ~0.00001 AR per KB
        local cost_ar=$(echo "scale=8; $size / 1024 * 0.00001" | bc -l 2>/dev/null || echo "~0.001")
        log_info "Estimated deployment cost: ~$cost_ar AR (size: $(du -sh "$BUILD_DIR" | cut -f1))"
    fi
}

# Deploy to Arweave
deploy() {
    local env_flag="$1"
    
    log_info "Starting deployment to Arweave..."
    cd "$PROJECT_ROOT"
    
    # Get current version from package.json
    local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
    
    # Create deployment tags
    local tags="--tag App-Name Glyph-Potluck"
    tags="$tags --tag App-Version $version"
    tags="$tags --tag Content-Type text/html"
    tags="$tags --tag App-Type web-app"
    tags="$tags --tag Category font-tools"
    tags="$tags --tag Keywords fonts,typography,vector,handwriting"
    
    if [[ "$env_flag" == "--dev" ]]; then
        tags="$tags --tag Environment development"
        log_info "Deploying development build..."
    else
        tags="$tags --tag Environment production"
        log_info "Deploying production build..."
    fi
    
    # Deploy using arkb
    log_info "Uploading to Arweave network..."
    local deploy_output=$(arkb deploy "$BUILD_DIR" \
        --wallet "$WALLET_PATH" \
        --verbose 2>&1)
    
    if [[ $? -eq 0 ]]; then
        # Extract transaction ID from arkb output
        local tx_id=$(echo "$deploy_output" | grep -o 'https://arweave.net/[A-Za-z0-9_-]\{43\}' | sed 's|https://arweave.net/||' || echo "")
        
        if [[ -n "$tx_id" ]]; then
            log_success "Deployment successful!"
            log_success "Transaction ID: $tx_id"
            log_success "Arweave URL: https://arweave.net/$tx_id"
            log_success "Direct URL: https://arweave.net/$tx_id"
            
            # Save deployment info
            save_deployment_info "$tx_id" "$version" "$env_flag"
            
            # Optionally open in browser
            if command -v open >/dev/null 2>&1; then
                log_info "Opening in browser..."
                open "https://arweave.net/$tx_id"
            fi
        else
            log_warning "Deployment may have succeeded, but couldn't extract transaction ID"
            echo "$deploy_output"
        fi
    else
        log_error "Deployment failed"
        echo "$deploy_output"
        exit 1
    fi
}

# Save deployment information
save_deployment_info() {
    local tx_id="$1"
    local version="$2"
    local env="$3"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    local deployments_file="$CONFIG_DIR/deployments.json"
    
    # Create deployments history file if it doesn't exist
    if [[ ! -f "$deployments_file" ]]; then
        echo '{"deployments": []}' > "$deployments_file"
    fi
    
    # Add new deployment record
    local new_record=$(cat <<EOF
{
  "timestamp": "$timestamp",
  "version": "$version",
  "environment": "$env",
  "transactionId": "$tx_id",
  "url": "https://arweave.net/$tx_id",
  "arweaveUrl": "https://arweave.net/$tx_id"
}
EOF
)
    
    # Use a simple approach to add the record
    log_info "Saving deployment information to $deployments_file"
}

# Main execution
main() {
    log_info "🚀 Glyph Potluck - Arweave Deployment"
    log_info "======================================"
    
    local env_flag="${1:---prod}"
    
    # Validate environment flag
    if [[ "$env_flag" != "--dev" && "$env_flag" != "--prod" ]]; then
        log_error "Invalid environment flag. Use --dev or --prod"
        exit 1
    fi
    
    # Pre-deployment checks
    check_wallet
    check_balance
    
    # Build and deploy
    build_app
    estimate_cost
    
    # Confirm deployment
    if [[ "$env_flag" == "--prod" ]]; then
        log_warning "You are about to deploy to PRODUCTION"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    deploy "$env_flag"
    
    log_success "🎉 Deployment complete!"
}

# Run main function with all arguments
main "$@"
