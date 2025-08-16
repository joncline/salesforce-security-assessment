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

### Sample Security Assessment Visualization

The tool generates interactive radar charts showing your organization's security posture across all categories:

![Security Category Scores](https://github.com/user-attachments/assets/sample-security-radar-chart.png)

*Sample radar chart showing security scores across the 7 evaluation categories. The chart provides an immediate visual overview of your organization's security strengths and areas for improvement.*

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

### Real Org Security Assessment

Run a comprehensive security assessment on your actual Salesforce org:

```bash
node tests/real-org-security-test.js your-org-alias
```

**Prerequisites:**
1. Authenticate with Salesforce CLI: `sf org login web --alias your-org-alias`
2. Ensure you have the required permissions (see Requirements section)

**Example:**
```bash
# Assess a development org
node tests/real-org-security-test.js mycompany-dev

# Assess a production org  
node tests/real-org-security-test.js production-org
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

## Requirements

- Node.js (v14 or higher)
- Salesforce CLI
- Access to a Salesforce organization
- Appropriate permissions to query security-related data

## License

This project is part of the Salesforce evaluation migration initiative and follows the same licensing terms as the original framework.

## Contributors

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
