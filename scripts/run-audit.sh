#!/bin/bash

# Salesforce Well-Architected Framework Audit - Execution Script
# This script automates the data collection and audit execution process

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/home/joncline/Documents/ClineApps/salesforce-eval-migration"
AUDIT_DATA_DIR="$PROJECT_DIR/audit-data"
REPORTS_DIR="$PROJECT_DIR/reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Salesforce CLI is installed
    if ! command -v sf &> /dev/null; then
        print_error "Salesforce CLI is not installed. Please install it first:"
        echo "npm install -g @salesforce/cli"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_DIR/src/evaluation/cline-audit-framework.js" ]; then
        print_error "Audit framework not found. Please ensure you're in the correct project directory."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to verify Salesforce connection
verify_connection() {
    print_status "Verifying Salesforce connection..."
    
    if ! sf org display &> /dev/null; then
        print_error "No Salesforce org connection found. Please authenticate first:"
        echo "sf org login web --instance-url https://your-org-url --alias your-org"
        exit 1
    fi
    
    # Get org info
    ORG_INFO=$(sf org display --json)
    ORG_URL=$(echo "$ORG_INFO" | jq -r '.result.instanceUrl')
    ORG_USERNAME=$(echo "$ORG_INFO" | jq -r '.result.username')
    
    print_success "Connected to org: $ORG_USERNAME ($ORG_URL)"
}

# Function to create directory structure
setup_directories() {
    print_status "Setting up directory structure..."
    
    mkdir -p "$AUDIT_DATA_DIR/metadata"
    mkdir -p "$AUDIT_DATA_DIR/queries"
    mkdir -p "$REPORTS_DIR"
    
    print_success "Directory structure created"
}

# Function to retrieve metadata
retrieve_metadata() {
    print_status "Retrieving Salesforce metadata..."
    
    cd "$PROJECT_DIR"
    
    # Security & Identity Metadata
    print_status "Retrieving security metadata..."
    sf project retrieve start --metadata Profile --metadata PermissionSet --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some security metadata may not be available"
    
    # Organization Configuration
    print_status "Retrieving organization configuration..."
    sf project retrieve start --metadata CustomSetting --metadata RemoteSiteSetting --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some org configuration may not be available"
    
    # Application & Code Metadata
    print_status "Retrieving application metadata..."
    sf project retrieve start --metadata ApexClass --metadata ApexTrigger --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some application metadata may not be available"
    sf project retrieve start --metadata LightningComponentBundle --metadata AuraDefinitionBundle --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some Lightning metadata may not be available"
    sf project retrieve start --metadata Flow --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some Flow metadata may not be available"
    
    # Integration & API Metadata
    print_status "Retrieving integration metadata..."
    sf project retrieve start --metadata ConnectedApp --metadata NamedCredential --target-metadata-dir "$AUDIT_DATA_DIR/metadata" || print_warning "Some integration metadata may not be available"
    
    print_success "Metadata retrieval completed"
}

# Function to collect runtime data
collect_runtime_data() {
    print_status "Collecting runtime data..."
    
    cd "$PROJECT_DIR"
    
    # Security Analysis Queries
    print_status "Collecting security data..."
    sf data query --query "SELECT Id, Name, Profile.Name, IsActive, LastLoginDate FROM User WHERE IsActive = true LIMIT 1000" --result-format csv > "$AUDIT_DATA_DIR/queries/users.csv" || print_warning "User data collection failed"
    
    sf data query --query "SELECT AssigneeId, Assignee.Name, PermissionSet.Name, PermissionSet.Type FROM PermissionSetAssignment LIMIT 1000" --result-format csv > "$AUDIT_DATA_DIR/queries/permission_set_assignments.csv" || print_warning "Permission set assignment data collection failed"
    
    # Performance & Monitoring Queries
    print_status "Collecting performance data..."
    sf data query --query "SELECT Id, Action, Section, CreatedDate, CreatedBy.Name FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:90 ORDER BY CreatedDate DESC LIMIT 1000" --result-format csv > "$AUDIT_DATA_DIR/queries/setup_audit_trail.csv" || print_warning "Setup audit trail collection failed"
    
    # Architecture & Configuration Queries
    print_status "Collecting architecture data..."
    sf data query --query "SELECT QualifiedApiName, Label, DeveloperName FROM EntityDefinition WHERE IsCustomizable = true LIMIT 1000" --result-format csv > "$AUDIT_DATA_DIR/queries/entity_definitions.csv" || print_warning "Entity definition collection failed"
    
    print_success "Runtime data collection completed"
}

# Function to execute audit
execute_audit() {
    print_status "Executing Salesforce Security Assessment..."
    
    cd "$PROJECT_DIR"
    
    # Run the security assessment with the connected org
    if [ -n "$ORG_USERNAME" ]; then
        # Extract org alias from username or use username directly
        ORG_ALIAS=$(sf org display --json | jq -r '.result.alias // .result.username')
        print_status "Running security assessment for org: $ORG_ALIAS"
        node tests/real-org-security-test.js "$ORG_ALIAS"
    else
        print_warning "No org connection found, running with default configuration"
        node tests/real-org-security-test.js
    fi
    
    print_success "Security assessment completed"
}

# Function to generate summary
generate_summary() {
    print_status "Generating audit summary..."
    
    # Count collected files
    METADATA_FILES=$(find "$AUDIT_DATA_DIR/metadata" -type f | wc -l)
    QUERY_FILES=$(find "$AUDIT_DATA_DIR/queries" -type f | wc -l)
    
    echo ""
    echo "=========================================="
    echo "SALESFORCE AUDIT EXECUTION SUMMARY"
    echo "=========================================="
    echo "Org URL: $ORG_URL"
    echo "Username: $ORG_USERNAME"
    echo "Metadata files collected: $METADATA_FILES"
    echo "Query result files: $QUERY_FILES"
    echo "Audit data location: $AUDIT_DATA_DIR"
    echo "Reports location: $REPORTS_DIR"
    echo ""
    echo "Next steps:"
    echo "1. Review the collected data in $AUDIT_DATA_DIR"
    echo "2. Use Cline to analyze the data with the audit framework"
    echo "3. Check generated reports in $REPORTS_DIR"
    echo ""
    echo "Sample Cline prompt:"
    echo "Execute a comprehensive Salesforce Well-Architected Framework audit using the framework in src/evaluation/cline-audit-framework.js. Analyze the metadata in ./audit-data/metadata/ and query results in ./audit-data/queries/. Generate detailed reports with scores and recommendations."
    echo "=========================================="
}

# Main execution
main() {
    echo "🚀 Salesforce Well-Architected Framework Audit"
    echo "==============================================="
    
    check_prerequisites
    verify_connection
    setup_directories
    retrieve_metadata
    collect_runtime_data
    execute_audit
    generate_summary
    
    print_success "Audit process completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --metadata-only Only retrieve metadata (skip queries)"
        echo "  --queries-only  Only run queries (skip metadata)"
        echo "  --dry-run      Show what would be executed without running"
        echo ""
        echo "Prerequisites:"
        echo "1. Salesforce CLI installed (npm install -g @salesforce/cli)"
        echo "2. Authenticated with target Salesforce org"
        echo "3. Node.js installed"
        echo ""
        echo "Example:"
        echo "  $0                    # Run full audit"
        echo "  $0 --metadata-only    # Only collect metadata"
        exit 0
        ;;
    --metadata-only)
        check_prerequisites
        verify_connection
        setup_directories
        retrieve_metadata
        print_success "Metadata collection completed!"
        exit 0
        ;;
    --queries-only)
        check_prerequisites
        verify_connection
        setup_directories
        collect_runtime_data
        print_success "Query data collection completed!"
        exit 0
        ;;
    --dry-run)
        echo "DRY RUN - Would execute the following steps:"
        echo "1. Check prerequisites"
        echo "2. Verify Salesforce connection"
        echo "3. Setup directory structure"
        echo "4. Retrieve metadata from Salesforce org"
        echo "5. Collect runtime data via queries"
        echo "6. Execute audit framework"
        echo "7. Generate summary report"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
