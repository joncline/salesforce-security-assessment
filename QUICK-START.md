# Quick Start Guide - Salesforce Well-Architected Framework Audit with Cline

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites (2 minutes)
```bash
# Install Salesforce CLI
npm install -g @salesforce/cli

# Verify installation
sf --version
```

### Step 2: Connect to Salesforce (1 minute)
```bash
# Connect to your Salesforce org
sf org login web --instance-url https://your-domain.sandbox.my.salesforce.com --alias my-org

# Set as default
sf config set target-org my-org

# Verify connection
sf org display
```

### Step 3: Run Automated Data Collection (2 minutes)
```bash
# Navigate to project
cd /home/joncline/Documents/ClineApps/salesforce-eval-migration

# Run the automated audit script
./scripts/run-audit.sh
```

## 🎯 Execute Audit with Cline

### Option A: Use the Ready-Made Prompt
Open Cline in VS Code and paste this prompt:

```
Execute a comprehensive Salesforce Well-Architected Framework audit using the framework in src/evaluation/cline-audit-framework.js. 

The audit should:
1. Analyze the metadata in ./audit-data/metadata/
2. Process the query results in ./audit-data/queries/
3. Evaluate all three pillars: Trusted (35%), Easy (30%), Adaptable (35%)
4. Generate a detailed report with scores and recommendations
5. Create an HTML report with visualizations

Use the same scoring system as the original Claude Code audit with 35 evaluation areas across the three pillars.
```

### Option B: Run Specific Analysis
For focused analysis, use these Cline prompts:

**Security Assessment:**
```
Analyze the Salesforce security configuration in ./audit-data/metadata/ and provide:
1. MFA enforcement status
2. Profile vs permission set usage analysis
3. Sharing model evaluation
4. API security assessment
5. Top 5 security recommendations with priority scores
```

**Performance Analysis:**
```
Review the Salesforce performance data and metadata to evaluate:
1. Query optimization opportunities
2. Governor limit utilization patterns
3. Bulk processing implementation
4. Caching strategies assessment
5. Performance bottlenecks with specific solutions
```

## 📊 What You'll Get

### Audit Reports Generated:
- **Overall Score**: 1-10 scale matching Claude Code system
- **Pillar Breakdown**: Trusted (35%), Easy (30%), Adaptable (35%)
- **35-Point Evaluation**: All subsections with detailed scoring
- **Visual HTML Report**: Charts and metrics
- **Action Plan**: Prioritized recommendations with timelines
- **Compliance Assessment**: Regulatory compliance status

### File Outputs:
```
reports/
├── audit-report.md           # Detailed markdown report
├── audit-report.html         # Visual HTML report with charts
├── action-plan.json          # Prioritized recommendations
└── compliance-summary.json   # Compliance status
```

## 🛠️ Troubleshooting

### Common Issues:

**"sf command not found"**
```bash
npm install -g @salesforce/cli
```

**"No org connection"**
```bash
sf org login web --instance-url https://your-org-url --alias my-org
sf config set target-org my-org
```

**"Permission denied on script"**
```bash
chmod +x ./scripts/run-audit.sh
```

**"Metadata retrieval failed"**
- Ensure you have System Administrator permissions
- Check that API access is enabled
- Verify org limits: `sf org display limits`

## 📋 Script Options

```bash
# Full audit (recommended)
./scripts/run-audit.sh

# Only collect metadata
./scripts/run-audit.sh --metadata-only

# Only run queries
./scripts/run-audit.sh --queries-only

# See what would be executed
./scripts/run-audit.sh --dry-run

# Get help
./scripts/run-audit.sh --help
```

## 🎯 Key Advantages Over Claude Code

✅ **Native VS Code Integration** - No CLI switching required  
✅ **Real-time Analysis** - Analyze code as you develop  
✅ **Enhanced Automation** - Integrated with development workflow  
✅ **Better File Management** - Direct access to project files  
✅ **Git Integration** - Track audit results over time  
✅ **Customizable Framework** - Modify evaluation criteria easily  

## 📈 Next Steps

1. **Run Initial Audit** - Execute your first comprehensive assessment
2. **Review Scores** - Focus on areas scoring below 7
3. **Implement Fixes** - Address critical and high-priority items
4. **Schedule Regular Audits** - Set up monthly assessments
5. **Track Progress** - Monitor improvements over time

## 🔗 Additional Resources

- **Detailed Guide**: `README-EXECUTION.md`
- **Migration Plan**: `docs/migration-plan.md`
- **Claude Code Analysis**: `docs/claude-code-analysis.md`
- **Configuration**: `config/evaluation-config.json`
- **Framework Code**: `src/evaluation/cline-audit-framework.js`

---

**Ready to migrate from Claude Code to Cline?** Start with the Quick Start steps above and experience the enhanced Salesforce evaluation capabilities within your VS Code environment!
