# Salesforce Security Assessment - PowerShell Execution Script
# This script provides Windows-native support for the audit process

param(
    [string]$Action = "",
    [switch]$Help,
    [switch]$MetadataOnly,
    [switch]$QueriesOnly,
    [switch]$DryRun
)

# Configuration
$PROJECT_DIR = $PSScriptRoot | Split-Path -Parent
$AUDIT_DATA_DIR = Join-Path $PROJECT_DIR "audit-data"
$REPORTS_DIR = Join-Path $PROJECT_DIR "reports"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if Salesforce CLI is installed
    try {
        $null = Get-Command sf -ErrorAction Stop
    }
    catch {
        Write-Error "Salesforce CLI is not installed. Please install it first:"
        Write-Host "npm install -g @salesforce/cli"
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $null = Get-Command node -ErrorAction Stop
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js first."
        Write-Host "Download from: https://nodejs.org/"
        exit 1
    }
    
    # Check if we're in the right directory
    $frameworkPath = Join-Path $PROJECT_DIR "src\evaluation\cline-audit-framework.js"
    if (-not (Test-Path $frameworkPath)) {
        Write-Error "Audit framework not found. Please ensure you're in the correct project directory."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to verify Salesforce connection
function Test-SalesforceConnection {
    Write-Status "Verifying Salesforce connection..."
    
    try {
        $orgInfo = sf org display --json | ConvertFrom-Json
        if ($orgInfo.status -ne 0) {
            throw "No org connection"
        }
        
        $orgUrl = $orgInfo.result.instanceUrl
        $orgUsername = $orgInfo.result.username
        
        Write-Success "Connected to org: $orgUsername ($orgUrl)"
        return @{
            Username = $orgUsername
            Url = $orgUrl
            Alias = $orgInfo.result.alias
        }
    }
    catch {
        Write-Error "No Salesforce org connection found. Please authenticate first:"
        Write-Host "sf org login web --instance-url https://your-org-url --alias your-org"
        exit 1
    }
}

# Function to create directory structure
function Initialize-Directories {
    Write-Status "Setting up directory structure..."
    
    $directories = @(
        (Join-Path $AUDIT_DATA_DIR "metadata"),
        (Join-Path $AUDIT_DATA_DIR "queries"),
        $REPORTS_DIR
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directory structure created"
}

# Function to retrieve metadata
function Get-SalesforceMetadata {
    Write-Status "Retrieving Salesforce metadata..."
    
    Set-Location $PROJECT_DIR
    
    # Security & Identity Metadata
    Write-Status "Retrieving security metadata..."
    try {
        sf project retrieve start --metadata Profile --metadata PermissionSet --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
    }
    catch {
        Write-Warning "Some security metadata may not be available"
    }
    
    # Organization Configuration
    Write-Status "Retrieving organization configuration..."
    try {
        sf project retrieve start --metadata RemoteSiteSetting --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
    }
    catch {
        Write-Warning "Some org configuration may not be available"
    }
    
    # Application & Code Metadata
    Write-Status "Retrieving application metadata..."
    try {
        sf project retrieve start --metadata ApexClass --metadata ApexTrigger --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
        sf project retrieve start --metadata LightningComponentBundle --metadata AuraDefinitionBundle --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
        sf project retrieve start --metadata Flow --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
    }
    catch {
        Write-Warning "Some application metadata may not be available"
    }
    
    # Integration & API Metadata
    Write-Status "Retrieving integration metadata..."
    try {
        sf project retrieve start --metadata ConnectedApp --metadata NamedCredential --target-metadata-dir (Join-Path $AUDIT_DATA_DIR "metadata")
    }
    catch {
        Write-Warning "Some integration metadata may not be available"
    }
    
    Write-Success "Metadata retrieval completed"
}

# Function to collect runtime data
function Get-RuntimeData {
    Write-Status "Collecting runtime data..."
    
    Set-Location $PROJECT_DIR
    
    # Security Analysis Queries
    Write-Status "Collecting security data..."
    try {
        sf data query --query "SELECT Id, Name, Profile.Name, IsActive, LastLoginDate FROM User WHERE IsActive = true LIMIT 1000" --result-format csv | Out-File -FilePath (Join-Path $AUDIT_DATA_DIR "queries\users.csv") -Encoding UTF8
    }
    catch {
        Write-Warning "User data collection failed"
    }
    
    try {
        sf data query --query "SELECT AssigneeId, Assignee.Name, PermissionSet.Name, PermissionSet.Type FROM PermissionSetAssignment LIMIT 1000" --result-format csv | Out-File -FilePath (Join-Path $AUDIT_DATA_DIR "queries\permission_set_assignments.csv") -Encoding UTF8
    }
    catch {
        Write-Warning "Permission set assignment data collection failed"
    }
    
    # Performance & Monitoring Queries
    Write-Status "Collecting performance data..."
    try {
        sf data query --query "SELECT Id, Action, Section, CreatedDate, CreatedBy.Name FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:90 ORDER BY CreatedDate DESC LIMIT 1000" --result-format csv | Out-File -FilePath (Join-Path $AUDIT_DATA_DIR "queries\setup_audit_trail.csv") -Encoding UTF8
    }
    catch {
        Write-Warning "Setup audit trail collection failed"
    }
    
    # Architecture & Configuration Queries
    Write-Status "Collecting architecture data..."
    try {
        sf data query --query "SELECT QualifiedApiName, Label, DeveloperName FROM EntityDefinition WHERE IsCustomizable = true LIMIT 1000" --result-format csv | Out-File -FilePath (Join-Path $AUDIT_DATA_DIR "queries\entity_definitions.csv") -Encoding UTF8
    }
    catch {
        Write-Warning "Entity definition collection failed"
    }
    
    Write-Success "Runtime data collection completed"
}

# Function to execute audit
function Invoke-SecurityAudit {
    param([hashtable]$OrgInfo)
    
    Write-Status "Executing Salesforce Security Assessment..."
    
    Set-Location $PROJECT_DIR
    
    # Run the security assessment with the connected org
    if ($OrgInfo.Alias) {
        Write-Status "Running security assessment for org: $($OrgInfo.Alias)"
        node "tests\real-org-security-test.js" $OrgInfo.Alias
    }
    elseif ($OrgInfo.Username) {
        Write-Status "Running security assessment for org: $($OrgInfo.Username)"
        node "tests\real-org-security-test.js" $OrgInfo.Username
    }
    else {
        Write-Warning "No org connection found, running with default configuration"
        node "tests\real-org-security-test.js"
    }
    
    Write-Success "Security assessment completed"
}

# Function to generate summary
function Write-AuditSummary {
    param([hashtable]$OrgInfo)
    
    Write-Status "Generating audit summary..."
    
    # Count collected files
    $metadataFiles = (Get-ChildItem -Path (Join-Path $AUDIT_DATA_DIR "metadata") -Recurse -File).Count
    $queryFiles = (Get-ChildItem -Path (Join-Path $AUDIT_DATA_DIR "queries") -File).Count
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor $Colors.Green
    Write-Host "SALESFORCE AUDIT EXECUTION SUMMARY" -ForegroundColor $Colors.Green
    Write-Host "==========================================" -ForegroundColor $Colors.Green
    Write-Host "Org URL: $($OrgInfo.Url)"
    Write-Host "Username: $($OrgInfo.Username)"
    Write-Host "Metadata files collected: $metadataFiles"
    Write-Host "Query result files: $queryFiles"
    Write-Host "Audit data location: $AUDIT_DATA_DIR"
    Write-Host "Reports location: $REPORTS_DIR"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review the collected data in $AUDIT_DATA_DIR"
    Write-Host "2. Use Cline to analyze the data with the audit framework"
    Write-Host "3. Check generated reports in $REPORTS_DIR"
    Write-Host ""
    Write-Host "Sample Cline prompt:"
    Write-Host "Execute a comprehensive Salesforce Security Assessment using the framework in src/evaluation/cline-audit-framework.js. Analyze the metadata in ./audit-data/metadata/ and query results in ./audit-data/queries/. Generate detailed reports with scores and recommendations."
    Write-Host "==========================================" -ForegroundColor $Colors.Green
}

# Function to show help
function Show-Help {
    Write-Host "Salesforce Security Assessment - PowerShell Script" -ForegroundColor $Colors.Green
    Write-Host "=================================================" -ForegroundColor $Colors.Green
    Write-Host ""
    Write-Host "Usage: .\run-audit.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help              Show this help message"
    Write-Host "  -MetadataOnly      Only retrieve metadata (skip queries)"
    Write-Host "  -QueriesOnly       Only run queries (skip metadata)"
    Write-Host "  -DryRun           Show what would be executed without running"
    Write-Host ""
    Write-Host "Prerequisites:"
    Write-Host "1. Node.js installed (https://nodejs.org/)"
    Write-Host "2. Salesforce CLI installed (npm install -g @salesforce/cli)"
    Write-Host "3. Authenticated with target Salesforce org"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run-audit.ps1                    # Run full audit"
    Write-Host "  .\run-audit.ps1 -MetadataOnly      # Only collect metadata"
    Write-Host "  .\run-audit.ps1 -QueriesOnly       # Only collect query data"
    Write-Host "  .\run-audit.ps1 -DryRun           # Show execution plan"
}

# Main execution function
function Invoke-Main {
    Write-Host "🚀 Salesforce Security Assessment" -ForegroundColor $Colors.Green
    Write-Host "=================================" -ForegroundColor $Colors.Green
    
    Test-Prerequisites
    $orgInfo = Test-SalesforceConnection
    Initialize-Directories
    Get-SalesforceMetadata
    Get-RuntimeData
    Invoke-SecurityAudit -OrgInfo $orgInfo
    Write-AuditSummary -OrgInfo $orgInfo
    
    Write-Success "Audit process completed successfully!"
}

# Handle script parameters
if ($Help) {
    Show-Help
    exit 0
}

if ($MetadataOnly) {
    Test-Prerequisites
    $orgInfo = Test-SalesforceConnection
    Initialize-Directories
    Get-SalesforceMetadata
    Write-Success "Metadata collection completed!"
    exit 0
}

if ($QueriesOnly) {
    Test-Prerequisites
    $orgInfo = Test-SalesforceConnection
    Initialize-Directories
    Get-RuntimeData
    Write-Success "Query data collection completed!"
    exit 0
}

if ($DryRun) {
    Write-Host "DRY RUN - Would execute the following steps:" -ForegroundColor $Colors.Yellow
    Write-Host "1. Check prerequisites"
    Write-Host "2. Verify Salesforce connection"
    Write-Host "3. Setup directory structure"
    Write-Host "4. Retrieve metadata from Salesforce org"
    Write-Host "5. Collect runtime data via queries"
    Write-Host "6. Execute security assessment"
    Write-Host "7. Generate summary report"
    exit 0
}

# Default: run main execution
Invoke-Main
