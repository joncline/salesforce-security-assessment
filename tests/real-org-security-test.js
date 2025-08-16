/**
 * Real Org Security Assessment Test
 * 
 * This script demonstrates the enhanced Salesforce Security Assessment
 * using real org data instead of mocks.
 */

const SalesforceWellArchitectedAudit = require('../src/evaluation/cline-audit-framework');
const fs = require('fs');
const path = require('path');

async function runRealOrgSecurityAssessment() {
    console.log('🔒 Starting Real Org Salesforce Security Assessment');
    console.log('=' .repeat(60));
    
    // Get org alias from command line arguments or use default
    const orgAlias = process.argv[2] || 'your-org-alias';
    
    if (orgAlias === 'your-org-alias') {
        console.log('⚠️  Please provide your Salesforce org alias as a command line argument:');
        console.log('   node tests/real-org-security-test.js <your-org-alias>');
        console.log('');
        console.log('📋 Example:');
        console.log('   node tests/real-org-security-test.js mycompany-dev');
        console.log('   node tests/real-org-security-test.js production-org');
        console.log('');
        console.log('💡 Make sure you have authenticated with the Salesforce CLI:');
        console.log('   sf org login web --alias <your-org-alias>');
        return;
    }
    
    try {
        // Initialize the security assessment framework
        const audit = new SalesforceWellArchitectedAudit();
        
        console.log(`🎯 Target Organization: ${orgAlias}`);
        console.log('📊 Assessment Categories:');
        console.log('   • Profiles and Permission Sets (including ConnectedApp analysis)');
        console.log('   • Object and Field Level Security (OLS & FLS)');
        console.log('   • Sharing and Visibility Settings');
        console.log('   • Custom Code and Metadata API');
        console.log('   • Public Access Settings');
        console.log('   • Data Classification');
        console.log('   • Audit Trails and Monitoring');
        console.log('');
        
        // Execute the comprehensive security audit
        console.log('🚀 Executing comprehensive security assessment...');
        const startTime = Date.now();
        
        const results = await audit.executeAudit(orgAlias);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('');
        console.log('✅ Security Assessment Completed!');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log('');
        
        // Display summary results
        console.log('📊 SECURITY ASSESSMENT SUMMARY');
        console.log('=' .repeat(60));
        console.log(`Overall Security Score: ${results.overallScore.toFixed(2)}/10`);
        console.log('');
        
        // Display score analysis
        if (results.scoreAnalysis) {
            console.log('🎯 TOP 3 REASONS FOR THIS SCORE:');
            results.scoreAnalysis.topReasons.forEach((reason, index) => {
                console.log(`  ${index + 1}. ${reason.reason}`);
            });
            console.log('');
            
            if (results.overallScore < 10) {
                console.log('📈 TOP 3 AREAS FOR IMPROVEMENT:');
                results.scoreAnalysis.improvementAreas.forEach((area, index) => {
                    console.log(`  ${index + 1}. ${area.reason}`);
                });
                console.log('');
            }
        }
        
        // Display category scores
        console.log('📋 Category Scores:');
        for (const [categoryKey, categoryResult] of Object.entries(results.securityCategories)) {
            const categoryConfig = audit.config.securityCategories[categoryKey];
            const score = categoryResult.score.toFixed(2);
            const weight = (categoryConfig.weight * 100).toFixed(0);
            
            let scoreIcon = '🟢';
            if (categoryResult.score < 2) scoreIcon = '🔴';
            else if (categoryResult.score < 5) scoreIcon = '🟠';
            else if (categoryResult.score < 7) scoreIcon = '🟡';
            
            console.log(`  ${scoreIcon} ${categoryConfig.name}: ${score}/10 (${weight}% weight)`);
        }
        console.log('');
        
        // Display priority recommendations summary
        const recommendations = results.recommendations;
        console.log('🎯 Security Recommendations Summary:');
        console.log(`  🚨 Critical: ${recommendations.critical.length} items`);
        console.log(`  ⚠️  High: ${recommendations.high.length} items`);
        console.log(`  ⚡ Medium: ${recommendations.medium.length} items`);
        console.log(`  ✅ Low: ${recommendations.low.length} items`);
        console.log('');
        
        // Show critical issues if any
        if (recommendations.critical.length > 0) {
            console.log('🚨 CRITICAL SECURITY ISSUES:');
            recommendations.critical.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec.category} (Score: ${rec.score.toFixed(2)}/10)`);
                console.log(`     ${rec.recommendation}`);
            });
            console.log('');
        }
        
        // Save reports to files
        console.log('📄 Generating Security Reports...');
        
        // Ensure reports directory exists
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Generate and save reports
        const reports = await audit.generateReports();
        
        // Save Markdown report
        const markdownPath = path.join(reportsDir, 'security-audit-report.md');
        fs.writeFileSync(markdownPath, reports.markdown);
        console.log(`  ✅ Markdown report saved: ${markdownPath}`);
        
        // Save HTML report
        const htmlPath = path.join(reportsDir, 'security-audit-report.html');
        fs.writeFileSync(htmlPath, reports.html);
        console.log(`  ✅ HTML report saved: ${htmlPath}`);
        
        // Save Action Plan (JSON)
        const actionPlanPath = path.join(reportsDir, 'security-action-plan.json');
        fs.writeFileSync(actionPlanPath, JSON.stringify(reports.actionPlan, null, 2));
        console.log(`  ✅ Action plan saved: ${actionPlanPath}`);
        
        // Save Compliance Summary (JSON)
        const compliancePath = path.join(reportsDir, 'security-compliance-summary.json');
        const complianceSummary = {
            overallScore: results.overallScore,
            categoryScores: {},
            recommendations: recommendations,
            timestamp: new Date().toISOString(),
            orgAlias: orgAlias
        };
        
        // Add category scores to compliance summary
        for (const [categoryKey, categoryResult] of Object.entries(results.securityCategories)) {
            const categoryConfig = audit.config.securityCategories[categoryKey];
            complianceSummary.categoryScores[categoryKey] = {
                name: categoryConfig.name,
                score: categoryResult.score,
                weight: categoryConfig.weight,
                details: categoryResult.details
            };
        }
        
        fs.writeFileSync(compliancePath, JSON.stringify(complianceSummary, null, 2));
        console.log(`  ✅ Compliance summary saved: ${compliancePath}`);
        
        console.log('');
        console.log('🎉 Security Assessment Complete!');
        console.log('');
        
        // Open the HTML report automatically
        console.log('🌐 Opening HTML report in your default browser...');
        const { exec } = require('child_process');
        const os = require('os');
        
        // Determine the command to open the file based on the operating system
        let openCommand;
        switch (os.platform()) {
            case 'darwin': // macOS
                openCommand = 'open';
                break;
            case 'win32': // Windows
                openCommand = 'start';
                break;
            default: // Linux and others
                openCommand = 'xdg-open';
                break;
        }
        
        // Execute the command to open the HTML report
        exec(`${openCommand} "${htmlPath}"`, (error) => {
            if (error) {
                console.log('⚠️  Could not automatically open the report. Please open it manually:');
                console.log(`   ${htmlPath}`);
            } else {
                console.log('✅ HTML report opened successfully!');
            }
        });
        
        console.log('');
        console.log('📋 Next Steps:');
        console.log('  1. Review the generated reports in the reports/ directory');
        console.log('  2. The HTML report should now be open in your browser for visual analysis');
        console.log('  3. Address critical and high-priority security issues first');
        console.log('  4. Implement the action plan based on priority and timeline');
        console.log('  5. Schedule regular security assessments (monthly/quarterly)');
        console.log('');
        console.log('💡 Pro Tips:');
        console.log('  • Focus on ConnectedApp security to prevent data theft');
        console.log('  • Monitor OAuth token usage patterns regularly');
        console.log('  • Implement proper field-level security for sensitive data');
        console.log('  • Set up automated alerts for security configuration changes');
        console.log('');
        console.log('📄 Report Files Generated:');
        console.log(`  📊 HTML Report: ${htmlPath}`);
        console.log(`  📝 Markdown Report: ${markdownPath}`);
        console.log(`  📋 Action Plan: ${actionPlanPath}`);
        console.log(`  📈 Compliance Summary: ${compliancePath}`);
        
    } catch (error) {
        console.error('❌ Security assessment failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('  1. Ensure you are authenticated with the Salesforce CLI');
        console.error('  2. Verify the org alias is correct and accessible');
        console.error('  3. Check your network connection and org permissions');
        console.error('  4. Make sure you have the required permissions to query security data');
        console.error('');
        console.error('📋 Required Permissions:');
        console.error('  • View All Data (or specific object permissions)');
        console.error('  • View Setup and Configuration');
        console.error('  • API Enabled');
        console.error('  • Access to LoginHistory, SetupAuditTrail, etc.');
        
        process.exit(1);
    }
}

// Run the assessment if this script is executed directly
if (require.main === module) {
    runRealOrgSecurityAssessment();
}

module.exports = { runRealOrgSecurityAssessment };
