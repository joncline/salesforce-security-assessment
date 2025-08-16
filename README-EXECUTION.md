# Salesforce Well-Architected Framework Audit - Cline Execution Guide

## Overview
This guide shows you how to execute a comprehensive Salesforce Well-Architected Framework audit using Cline in VS Code. The audit replicates the same 35-point evaluation system from Claude Code but runs natively within your development environment.

## Prerequisites

### 1. Install Salesforce CLI
```bash
# Install Salesforce CLI
npm install -g @salesforce/cli

# Verify installation
sf --version
```

### 2. Install Node.js Dependencies
```bash
# Navigate to project directory
cd /home/joncline/Documents/ClineApps/salesforce-eval-migration

# Install dependencies (if package.json exists)
npm install

# Or install required packages manually
npm install --save-dev @salesforce/cli
```

### 3. Authenticate with Salesforce Org
```bash
# For Production Org
sf org login web --instance-url https://your-domain.my.salesforce.com --alias prod-org

# For Sandbox Org
sf org login web --instance-url https://your-domain--sandbox.sandbox.my.salesforce.com --alias sandbox-org

# Set default org (replace with your alias)
sf config set target-org sandbox-org
```

## Execution Steps

### Step 1: Verify Salesforce Connection
```bash
# Check org connection
sf org display

# Test basic query
sf data query --query "SELECT Id, Name FROM Organization LIMIT 1"
```

### Step 2: Gather Required Metadata

#### Security & Identity Metadata
```bash
# Create metadata directory
mkdir -p ./audit-data/metadata

# Retrieve security settings
sf project retrieve start --metadata SecuritySettings --target-dir ./audit-data/metadata

# Retrieve profiles and permission sets
sf project retrieve start --metadata Profile,PermissionSet --target-dir ./audit-data/metadata

# Retrieve sharing rules
sf project retrieve start --metadata SharingRules --target-dir ./audit-data/metadata

# Retrieve network access settings
sf project retrieve start --metadata Network --target-dir ./audit-data/metadata
```

#### Organization Configuration
```bash
# Retrieve organization settings
sf project retrieve start --metadata OrgPreferenceSettings --target-dir ./audit-data/metadata

# Retrieve custom settings
sf project retrieve start --metadata CustomSetting --target-dir ./audit-data/metadata

# Retrieve remote site settings
sf project retrieve start --metadata RemoteSiteSetting --target-dir ./audit-data/metadata
```

#### Application & Code Metadata
```bash
# Retrieve Apex classes and triggers
sf project retrieve start --metadata ApexClass,ApexTrigger --target-dir ./audit-data/metadata

# Retrieve Lightning components
sf project retrieve start --metadata LightningComponentBundle,AuraDefinitionBundle --target-dir ./audit-data/metadata

# Retrieve flows and process builders
sf project retrieve start --metadata Flow --target-dir ./audit-data/metadata

# Retrieve validation rules
sf project retrieve start --metadata ValidationRule --target-dir ./audit-data/metadata
```

#### Integration & API Metadata
```bash
# Retrieve connected apps
sf project retrieve start --metadata ConnectedApp --target-dir ./audit-data/metadata

# Retrieve named credentials
sf project retrieve start --metadata NamedCredential --target-dir ./audit-data/metadata

# Retrieve external data sources
sf project retrieve start --metadata ExternalDataSource --target-dir ./audit-data/metadata
```

### Step 3: Collect Runtime Data

#### Security Analysis Queries
```bash
# Export user security data
sf data export --query "SELECT Id, Name, Profile.Name, IsActive, LastLoginDate FROM User WHERE IsActive = true" --result-format csv --target-dir ./audit-data/queries

# Export permission set assignments
sf data export --query "SELECT AssigneeId, Assignee.Name, PermissionSet.Name, PermissionSet.Type FROM PermissionSetAssignment" --result-format csv --target-dir ./audit-data/queries

# Export login history (last 30 days)
sf data export --query "SELECT UserId, User.Name, LoginTime, SourceIp, Status FROM LoginHistory WHERE LoginTime = LAST_N_DAYS:30" --result-format csv --target-dir ./audit-data/queries
```

#### Performance & Monitoring Queries
```bash
# Export setup audit trail
sf data export --query "SELECT Id, Action, Section, CreatedDate, CreatedBy.Name FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:90 ORDER BY CreatedDate DESC" --result-format csv --target-dir ./audit-data/queries

# Export API usage
sf data export --query "SELECT Id, RequestIdentifier, StartTime, EndTime, DurationMilliseconds, ApiType, ApiVersion FROM ApiEvent WHERE StartTime = LAST_N_DAYS:7" --result-format csv --target-dir ./audit-data/queries
```

#### Architecture & Configuration Queries
```bash
# Export custom objects and fields
sf data export --query "SELECT QualifiedApiName, Label, DeveloperName FROM EntityDefinition WHERE IsCustomizable = true" --result-format csv --target-dir ./audit-data/queries

# Export workflow rules and process builders
sf data export --query "SELECT Id, Name, Type, State FROM FlowDefinition WHERE ActiveVersion.Status = 'Active'" --result-format csv --target-dir ./audit-data/queries
```

### Step 4: Execute Cline Audit

#### Option A: Using Cline Interactive Mode
1. Open VS Code in the project directory
2. Start Cline
3. Use this prompt:

```
Execute a comprehensive Salesforce Well-Architected Framework audit using the framework in src/evaluation/cline-audit-framework.js. 

The audit should:
1. Analyze the metadata in ./audit-data/metadata/
2. Process the query results in ./audit-data/queries/
3. Evaluate all three pillars: Trusted (35%), Easy (30%), Adaptable (35%)
4. Generate a detailed report with scores and recommendations
5. Create an HTML report with visualizations

Target Salesforce Org: [YOUR_ORG_URL]
```

#### Option B: Using Node.js Script
```bash
# Run the audit framework directly
node src/evaluation/cline-audit-framework.js

# Or run with specific org URL
node -e "
const SalesforceAudit = require('./src/evaluation/cline-audit-framework.js');
const audit = new SalesforceAudit();
audit.executeAudit('https://your-org.sandbox.lightning.force.com/')
  .then(results => console.log('Audit completed:', results))
  .catch(error => console.error('Audit failed:', error));
"
```

### Step 5: Review Audit Results

The audit will generate several outputs:

#### Generated Files
- `./reports/audit-report.md` - Detailed markdown report
- `./reports/audit-report.html` - Visual HTML report with charts
- `./reports/action-plan.json` - Prioritized recommendations
- `./reports/compliance-summary.json` - Compliance status

#### Report Sections
1. **Overall Score** (1-10 scale)
2. **Pillar Breakdown**:
   - Trusted (35%): Security, Compliance, Reliability
   - Easy (30%): Intentional, Automated, Engaging  
   - Adaptable (35%): Resilient, Composable
3. **Detailed Recommendations** by priority
4. **Action Plan** with timelines
5. **Compliance Assessment**

## Advanced Usage

### Custom Evaluation Criteria
Edit `config/evaluation-config.json` to customize:
- Scoring thresholds
- Evaluation criteria weights
- Compliance requirements
- Performance benchmarks

### Automated Scheduling
Set up automated audits using cron jobs:
```bash
# Add to crontab for monthly audits
0 0 1 * * cd /home/joncline/Documents/ClineApps/salesforce-eval-migration && ./scripts/automated-audit.sh
```

### Integration with CI/CD
Add audit checks to your deployment pipeline:
```yaml
# Example GitHub Actions workflow
- name: Run Salesforce Audit
  run: |
    cd salesforce-eval-migration
    npm run audit
    # Fail build if score below threshold
    node scripts/check-audit-score.js --min-score 7.0
```

## Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Re-authenticate if needed
sf org logout --target-org your-org-alias
sf org login web --instance-url https://your-org-url --alias your-org-alias
```

#### Metadata Retrieval Errors
```bash
# Check org limits
sf org display limits

# Verify metadata types exist
sf project list metadata --metadata-type Profile
```

#### Permission Issues
Ensure your user has:
- System Administrator profile OR
- View Setup and Configuration permission
- API Enabled permission
- Modify All Data permission (for comprehensive analysis)

### Performance Optimization

#### Large Org Considerations
For orgs with extensive metadata:
```bash
# Retrieve metadata in smaller batches
sf project retrieve start --metadata Profile:Admin,Profile:Standard --target-dir ./audit-data/metadata

# Use specific date ranges for queries
sf data export --query "SELECT ... WHERE CreatedDate = LAST_N_DAYS:30" --result-format csv
```

#### Memory Management
```bash
# Increase Node.js memory limit if needed
node --max-old-space-size=4096 src/evaluation/cline-audit-framework.js
```

## Sample Cline Prompts

### Quick Security Assessment
```
Analyze the Salesforce security configuration in ./audit-data/metadata/ and provide:
1. MFA enforcement status
2. Profile vs permission set usage
3. Sharing model analysis
4. API security assessment
5. Top 5 security recommendations
```

### Performance Analysis
```
Review the Salesforce performance data and metadata to evaluate:
1. Query optimization opportunities
2. Governor limit utilization
3. Bulk processing patterns
4. Caching strategies
5. Performance bottlenecks with solutions
```

### Compliance Check
```
Perform a compliance assessment focusing on:
1. GDPR requirements (data protection, consent management)
2. SOX compliance (audit trails, change management)
3. Industry-specific regulations
4. Data governance maturity
5. Compliance gap analysis with remediation plan
```

## Next Steps

1. **Execute Initial Audit**: Run your first comprehensive audit
2. **Review Results**: Analyze scores and recommendations
3. **Create Action Plan**: Prioritize improvements based on audit findings
4. **Implement Changes**: Address critical and high-priority items
5. **Schedule Regular Audits**: Set up monthly or quarterly assessments
6. **Track Progress**: Monitor score improvements over time

## Support

For issues or questions:
- Review the migration documentation in `docs/`
- Check the troubleshooting section above
- Examine the audit framework code in `src/evaluation/`
- Test individual components using the examples in `examples/`
