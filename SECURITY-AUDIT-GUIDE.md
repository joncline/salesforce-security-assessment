# 🔒 Salesforce Security Assessment - Quick Start Guide

## Prerequisites

Before starting the security audit, ensure you have:

1. **Salesforce CLI installed**
   ```bash
   npm install -g @salesforce/cli
   ```

2. **Node.js installed** (version 14 or higher)

3. **Authenticated with your Salesforce org**
   ```bash
   sf org login web --alias your-org-name
   ```

4. **Required Salesforce permissions:**
   - View All Data (or specific object permissions)
   - View Setup and Configuration
   - API Enabled
   - Access to LoginHistory, SetupAuditTrail, etc.

## 🚀 Three Ways to Start the Security Audit

### Method 1: Quick Security Assessment (Recommended)

**Best for:** Quick security evaluation of your org

```bash
# Navigate to the project directory
cd /home/joncline/Documents/ClineApps/salesforce-eval-migration

# Run the security assessment directly
node tests/real-org-security-test.js your-org-alias
```

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

**Best for:** Comprehensive audit with metadata collection

```bash
# Make the script executable
chmod +x scripts/run-audit.sh

# Run the full audit process
./scripts/run-audit.sh
```

**This will:**
1. ✅ Check prerequisites
2. 🔗 Verify Salesforce connection
3. 📁 Set up directory structure
4. 📦 Retrieve metadata from your org
5. 📊 Collect runtime data via queries
6. 🔍 Execute security assessment
7. 📄 Generate comprehensive reports

### Method 3: Step-by-Step Manual Process

**Best for:** Custom analysis or troubleshooting

```bash
# 1. Collect metadata only
./scripts/run-audit.sh --metadata-only

# 2. Collect query data only
./scripts/run-audit.sh --queries-only

# 3. Run security assessment
node tests/real-org-security-test.js your-org-alias
```

## 📊 What You'll Get

After running the security audit, you'll receive:

### 📈 Security Score
- Overall security score (0-10)
- Individual category scores with weights
- Score analysis with improvement areas

### 🎯 7 Security Categories Evaluated
1. **Profiles and Permission Sets** (15% weight)
   - Including ConnectedApp security analysis
2. **Object and Field Level Security** (15% weight)
3. **Sharing and Visibility Settings** (15% weight)
4. **Custom Code and Metadata API** (15% weight)
5. **Public Access Settings** (10% weight)
6. **Data Classification** (15% weight)
7. **Audit Trails and Monitoring** (15% weight)

### 📄 Generated Reports
- **HTML Report** (`reports/security-audit-report.html`) - Visual dashboard with charts
- **Markdown Report** (`reports/security-audit-report.md`) - Detailed text report
- **Action Plan** (`reports/security-action-plan.json`) - Prioritized action items
- **Compliance Summary** (`reports/security-compliance-summary.json`) - JSON data for integration

### 🚨 Priority Recommendations
- **Critical** - Immediate attention required
- **High** - Significant security gaps
- **Medium** - Needs improvement
- **Low** - Optimization opportunities

## 🔧 Troubleshooting

### Common Issues

**"No Salesforce org connection found"**
```bash
# Authenticate with your org
sf org login web --alias your-org-name

# Verify connection
sf org display
```

**"Command failed" errors during queries**
- Some queries may fail due to org limitations or permissions
- The tool handles these gracefully and continues the assessment
- Check that you have the required permissions listed above

**"Missing metadata type definition in registry" errors**
- Some metadata types like `CustomSetting` are not available in newer SF CLI versions
- The script has been updated to use only valid metadata types
- These errors have been resolved in the latest version

**"Metadata retrieval failed"**
- Some metadata types may not be available in all org types
- The script continues with available data
- Ensure you have "View Setup and Configuration" permission

### Getting Help

**View script options:**
```bash
./scripts/run-audit.sh --help
```

**Dry run to see what will be executed:**
```bash
./scripts/run-audit.sh --dry-run
```

## 💡 Pro Tips

1. **Start with Method 1** for a quick assessment
2. **Use Method 2** for comprehensive analysis with data collection
3. **Focus on ConnectedApp security** to prevent data theft
4. **Monitor OAuth token usage patterns** regularly
5. **Address Critical and High priority items first**
6. **Schedule regular assessments** (monthly/quarterly)

## 📋 Next Steps After Assessment

1. **Review the HTML report** (opens automatically in your browser)
2. **Address critical security issues immediately**
3. **Implement the action plan** based on priority and timeline
4. **Set up monitoring** for security configuration changes
5. **Schedule regular security assessments**

---

*Security Assessment Tool by Jon Cline - People First CRM and DevPod for Salesforce Partners*
