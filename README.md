# Salesforce Security Assessment Tool

A comprehensive security evaluation tool for Salesforce organizations, built with Cline and designed to assess security configurations across 7 critical categories.

## Overview

This tool transforms the original Salesforce Well-Architected Framework audit into a focused **Salesforce Security Assessment** that evaluates your organization's security posture across key areas including profiles, permissions, data access, custom code, and monitoring.

## Features

- **7 Security Categories**: Comprehensive evaluation across critical security domains
- **Salesforce CLI Integration**: Automated data collection using SF CLI commands
- **Multiple Report Formats**: Markdown, HTML (with charts), and JSON outputs
- **Prioritized Recommendations**: Critical, High, Medium, and Low priority security recommendations
- **Action Plans**: Timeline-based security improvement roadmap
- **Connected Apps Analysis**: Includes review of connected applications and their data access levels

### Sample Security Assessment Output

The tool generates comprehensive reports including visual radar charts in the HTML output showing your organization's security posture across all categories:

```
Security Assessment Results:
┌─────────────────────────────────────┬───────┬────────────┐
│ Security Category                   │ Score │ Status     │
├─────────────────────────────────────┼───────┼────────────┤
│ Profiles and Permission Sets        │  7.2  │ Good       │
│ Object and Field Level Security     │  6.8  │ Needs Work │
│ Sharing and Visibility Settings     │  8.1  │ Excellent  │
│ Custom Code and Metadata API        │  5.4  │ Needs Work │
│ Public Access Settings              │  9.0  │ Excellent  │
│ Data Classification                 │  6.2  │ Needs Work │
│ Audit Trails and Monitoring         │  7.8  │ Good       │
└─────────────────────────────────────┴───────┴────────────┘

Overall Security Score: 7.2/10
```

*The HTML report includes interactive radar charts providing an immediate visual overview of your organization's security strengths and areas for improvement.*

## Security Categories

1. **Profiles and Permission Sets** (15% weight)
   - Evaluates user profiles, permission sets, and connected app access levels
   - Identifies overly privileged profiles and permission configurations

2. **Object and Field Level Security (OLS & FLS)** (15% weight)
   - Assesses data access restrictions at object and field levels
   - Reviews permission configurations for data protection

3. **Sharing and Visibility Settings** (15% weight)
   - Examines organization-wide defaults, sharing rules, and role hierarchies
   - Evaluates data visibility and access controls

4. **Custom Code and Metadata API** (15% weight)
   - Reviews Apex, Visualforce, Lightning components for security vulnerabilities
   - Analyzes Metadata API usage and custom development security

5. **Public Access Settings** (10% weight)
   - Checks guest user profiles, public sites, and unauthenticated access
   - Evaluates external-facing security configurations

6. **Data Classification** (15% weight)
   - Evaluates classification of sensitive data and protection mechanisms
   - Reviews data handling and privacy controls

7. **Audit Trails and Monitoring** (15% weight)
   - Assesses logging, event monitoring, and audit trail configurations
   - Reviews security monitoring and compliance tracking

## Installation

1. Ensure you have Node.js installed
2. Clone this repository
3. Install Salesforce CLI if not already installed
4. Configure your Salesforce org connection

## Usage

### Method 1: Quick Security Assessment (Recommended)

Run a direct security assessment on your Salesforce org:

```bash
node tests/real-org-security-test.js your-org-alias
```

**Prerequisites:**
1. Authenticate with Salesforce CLI: `sf org login web --alias your-org-alias`
2. Ensure you have the required permissions (see Requirements section)

**Examples:**
```bash
# Assess a scratch org
node tests/real-org-security-test.js my-scratch-org

# Assess a sandbox org
node tests/real-org-security-test.js mycompany-sandbox

# Assess a development org
node tests/real-org-security-test.js mycompany-dev

# Assess a production org  
node tests/real-org-security-test.js production-org
```

### Method 2: Full Audit with Data Collection

For comprehensive analysis with metadata collection:

```bash
# Make the script executable (first time only)
chmod +x scripts/run-audit.sh

# Run the full audit process
./scripts/run-audit.sh
```

**This method will:**
1. ✅ Check prerequisites
2. 🔗 Verify Salesforce connection  
3. 📁 Set up directory structure
4. 📦 Retrieve metadata from your org
5. 📊 Collect runtime data via queries
6. 🔍 Execute security assessment
7. 📄 Generate comprehensive reports

**Script Options:**
```bash
# View all available options
./scripts/run-audit.sh --help

# Collect metadata only
./scripts/run-audit.sh --metadata-only

# Collect query data only  
./scripts/run-audit.sh --queries-only

# See what would be executed without running
./scripts/run-audit.sh --dry-run
```

### Programmatic Usage

```javascript
const SalesforceWellArchitectedAudit = require('./src/evaluation/cline-audit-framework');

async function runAssessment() {
    const audit = new SalesforceWellArchitectedAudit();
    const results = await audit.executeAudit('your-org-alias');
    
    console.log(`Overall Security Score: ${results.overallScore}/10`);
    console.log('Critical Issues:', results.recommendations.critical.length);
}

runAssessment();
```

### Running the Demo (Mock Data)

```bash
cd tests
node security-assessment-test.js
```

This will run a demonstration with mock data and generate sample reports.

### Configuration

The security evaluation can be customized via `config/security-evaluation-config.json`:

```json
{
  "securityCategories": {
    "profilesAndPermissionSets": {
      "name": "Profiles and Permission Sets",
      "weight": 0.15,
      "description": "Evaluates security configurations related to user profiles, permission sets, and connected app access."
    }
    // ... other categories
  },
  "scoringThresholds": {
    "critical": 0.20,
    "high": 0.40,
    "medium": 0.60,
    "low": 0.80
  }
}
```

## Generated Reports

The tool generates several types of reports:

### 1. Markdown Report (`reports/security-audit-report.md`)
- Comprehensive text-based security assessment
- Category scores and detailed findings
- Prioritized recommendations
- Action plan with timelines

### 2. HTML Report (`reports/security-audit-report.html`)
- Visual report with interactive charts
- Radar chart showing security category scores
- Color-coded priority sections
- Professional formatting for stakeholder presentations

### 3. Action Plan JSON (`reports/security-action-plan.json`)
- Machine-readable action items
- Categorized by timeline (immediate, short-term, medium-term, long-term)
- Priority and effort estimates

### 4. Compliance Summary (`reports/security-compliance-summary.json`)
- High-level security metrics
- Recommendation counts by priority
- Timestamp and organization details

## Salesforce CLI Integration

The tool uses Salesforce CLI commands to collect security-relevant data:

### Metadata Collection
- `sf project retrieve start --metadata Profile`
- `sf project retrieve start --metadata PermissionSet`
- `sf project retrieve start --metadata ConnectedApp`
- And other security-relevant metadata types

### Query Data Collection
- User and profile permissions
- Object and field permissions
- Permission set assignments
- Login history and audit data
- Connected app OAuth policies

## Security Scoring

- **Overall Score**: Weighted average of all security categories (0-10 scale)
- **Category Scores**: Individual assessment of each security domain
- **Priority Levels**:
  - **Critical**: Score < 2 (immediate attention required)
  - **High**: Score 2-5 (significant security gaps)
  - **Medium**: Score 5-7 (needs improvement)
  - **Low**: Score 7+ (performing well, optimization opportunities)

## Project Structure

```
├── config/
│   └── security-evaluation-config.json    # Security assessment configuration
├── src/
│   └── evaluation/
│       └── cline-audit-framework.js       # Main security assessment logic
├── reports/                               # Generated security reports
├── tests/
│   └── security-assessment-test.js        # Demo and testing
└── README.md                             # This file
```

## Key Implementation Features

- **Connected Apps Analysis**: Specifically includes review of connected applications and their data access levels within the "Profiles and permission sets" evaluation
- **Security-Focused Scoring**: All evaluation logic focuses on security best practices
- **Configurable Weights**: Security category importance can be adjusted
- **Comprehensive Data Collection**: Automated gathering of security-relevant metadata and query data
- **Professional Reporting**: Multiple output formats for different audiences

## Development

### Adding New Security Checks

1. Modify the appropriate evaluation method in `src/evaluation/cline-audit-framework.js`
2. Add new data collection queries if needed
3. Update scoring logic based on findings
4. Test with the demo script

### Customizing Reports

- Modify `generateMarkdownReport()` for text-based reports
- Update `generateHTMLReport()` for visual reports
- Adjust `formatRecommendations()` and `formatActionPlan()` for custom formatting

## Platform Compatibility

This tool is **cross-platform compatible** and works on:
- ✅ **Windows** (Windows 10/11, Windows Server)
- ✅ **macOS** (macOS 10.15+)
- ✅ **Linux** (Ubuntu, CentOS, RHEL, etc.)

### Platform-Specific Notes

#### Windows
- **Method 1 (Quick Assessment)** works natively with Command Prompt or PowerShell
- **Method 2 (Full Audit Script)** requires one of the following:
  - **Git Bash** (recommended - comes with Git for Windows)
  - **Windows Subsystem for Linux (WSL)**
  - **PowerShell with bash support**

#### macOS
- All methods work natively with Terminal
- Ensure Xcode Command Line Tools are installed: `xcode-select --install`

#### Linux
- All methods work natively
- Most distributions include bash by default

### Cross-Platform Usage Examples

#### Method 1: Quick Assessment (All Platforms)
```bash
# Windows (Command Prompt/PowerShell)
node tests/real-org-security-test.js your-org-alias

# macOS/Linux (Terminal)
node tests/real-org-security-test.js your-org-alias
```

#### Method 2: Full Audit Script

**Windows:**
```powershell
# Using PowerShell (recommended for Windows)
.\scripts\run-audit.ps1

# Alternative: Using Git Bash
chmod +x scripts/run-audit.sh
./scripts/run-audit.sh
```

**macOS/Linux:**
```bash
chmod +x scripts/run-audit.sh
./scripts/run-audit.sh
```

## Requirements

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Salesforce CLI** - Install via: `npm install -g @salesforce/cli`
- **Git** (Windows users need Git Bash for Method 2) - [Download](https://git-scm.com/)
- Access to a Salesforce organization
- Appropriate permissions to query security-related data

### Platform-Specific Installation

#### Windows
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install Git for Windows (includes Git Bash): [git-scm.com](https://git-scm.com/)
3. Install Salesforce CLI: `npm install -g @salesforce/cli`
4. Use Git Bash for running bash scripts, or Command Prompt/PowerShell for Node.js commands

#### macOS
1. Install Node.js: `brew install node` or download from [nodejs.org](https://nodejs.org/)
2. Install Salesforce CLI: `npm install -g @salesforce/cli`
3. Ensure Xcode Command Line Tools: `xcode-select --install`

#### Linux
1. Install Node.js via package manager or from [nodejs.org](https://nodejs.org/)
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install nodejs npm
   
   # CentOS/RHEL
   sudo yum install nodejs npm
   ```
2. Install Salesforce CLI: `npm install -g @salesforce/cli`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Jon Cline

## Contributors

- **Jon Cline** - Security Assessment Implementation and Migration Lead
  - Website: [www.joncline.com](https://www.joncline.com)
  - LinkedIn: [https://www.linkedin.com/in/joncline](https://www.linkedin.com/in/joncline)
  - Led the transformation from Well-Architected Framework to focused Security Assessment tool

- **Malo Lesegretain** - Original Well-Architected Framework concept and implementation
  - LinkedIn: [https://www.linkedin.com/in/malolesegretain/](https://www.linkedin.com/in/malolesegretain/)
  - Provided the foundational architecture and evaluation framework that inspired this security-focused implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the demo script
5. Submit a pull request

## Support

For questions or issues related to the security assessment functionality, please refer to the implementation plan and existing documentation.
