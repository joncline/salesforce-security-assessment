/**
 * Basic test for Salesforce Security Assessment
 * This demonstrates the security assessment functionality
 */

const SalesforceWellArchitectedAudit = require('../src/evaluation/cline-audit-framework');
const fs = require('fs');
const path = require('path');

async function runSecurityAssessmentDemo() {
    console.log('🧪 Running Salesforce Security Assessment Demo');
    console.log('=' .repeat(50));

    try {
        // Initialize the audit framework
        const audit = new SalesforceWellArchitectedAudit();
        console.log('✅ Security assessment framework initialized');

        // Mock org data for demonstration (since we don't have a real SF org connected)
        // This includes data that will trigger ConnectedApp security analysis
        audit.orgData = {
            metadata: {
                profiles: { status: 'success', data: { result: { files: [] } } },
                connectedApps: { status: 'success', data: { result: { files: [{ fullName: 'TestApp' }] } } }
            },
            queryData: {
                profiles: [
                    { Id: '1', Name: 'System Administrator', PermissionsModifyAllData: true, PermissionsViewAllData: true },
                    { Id: '2', Name: 'Standard User', PermissionsModifyAllData: false, PermissionsViewAllData: false }
                ],
                objectPermissions: [
                    { Parent: { Name: 'Admin Profile' }, SobjectType: 'Account', PermissionsModifyAllRecords: true }
                ],
                fieldPermissions: [],
                users: [],
                permissionSetAssignments: [],
                loginHistory: [],
                // Enhanced ConnectedApp data to demonstrate security risks
                connectedApps: [
                    {
                        Id: '0H0xx0000000001',
                        Name: 'Suspicious Data Extractor',
                        CreatedBy: { Name: 'External User' },
                        CreatedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                        LastModifiedBy: { Name: 'External User' },
                        LastModifiedDate: new Date().toISOString(),
                        OptionsAllowAdminApprovedUsersOnly: false, // SECURITY RISK: No admin approval required
                        OptionsHasSessionLevelPolicy: false, // SECURITY RISK: No session policies
                        OptionsRefreshTokenValidityMetric: 'Days',
                        RefreshTokenValidityPeriod: '7776000' // 90+ days - SECURITY RISK
                    },
                    {
                        Id: '0H0xx0000000002',
                        Name: 'Legitimate Business App',
                        CreatedBy: { Name: 'System Administrator' },
                        CreatedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                        LastModifiedBy: { Name: 'System Administrator' },
                        LastModifiedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        OptionsAllowAdminApprovedUsersOnly: true, // SECURE: Admin approval required
                        OptionsHasSessionLevelPolicy: true, // SECURE: Has session policies
                        OptionsRefreshTokenValidityMetric: 'Days',
                        RefreshTokenValidityPeriod: '2592000' // 30 days - SECURE
                    }
                ],
                oauthTokens: [
                    {
                        Id: 'OAT001',
                        AppName: 'Suspicious Data Extractor',
                        UserId: 'U001',
                        User: { Name: 'John Doe' },
                        CreatedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        LastUsedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Used yesterday
                        UseCount: 1500 // HIGH USAGE - potential data exfiltration
                    },
                    {
                        Id: 'OAT002',
                        AppName: 'Legitimate Business App',
                        UserId: 'U002',
                        User: { Name: 'Jane Smith' },
                        CreatedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        LastUsedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        UseCount: 45 // Normal usage
                    }
                ],
                connectedAppOAuthTokens: []
            }
        };

        // Set mock org alias
        audit.orgAlias = 'demo-org';

        console.log('📊 Running security evaluation...');

        // Run security evaluation
        await audit.evaluateSecurityCategories();
        console.log('✅ Security categories evaluated');

        // Calculate overall score
        audit.calculateOverallScore();
        console.log('✅ Overall security score calculated');

        // Generate recommendations
        audit.generateRecommendations();
        console.log('✅ Security recommendations generated');

        // Generate action plan
        audit.generateActionPlan();
        console.log('✅ Security action plan generated');

        // Generate reports
        const reports = await audit.generateReports();
        console.log('✅ Security reports generated');

        // Save reports to files
        const reportsDir = path.join(__dirname, '../reports');
        
        // Save markdown report
        fs.writeFileSync(
            path.join(reportsDir, 'security-audit-report.md'),
            reports.markdown
        );
        console.log('📄 Markdown report saved to reports/security-audit-report.md');

        // Save HTML report
        fs.writeFileSync(
            path.join(reportsDir, 'security-audit-report.html'),
            reports.html
        );
        console.log('📄 HTML report saved to reports/security-audit-report.html');

        // Save action plan as JSON
        fs.writeFileSync(
            path.join(reportsDir, 'security-action-plan.json'),
            JSON.stringify(reports.actionPlan, null, 2)
        );
        console.log('📄 Action plan saved to reports/security-action-plan.json');

        // Save compliance summary
        const complianceSummary = {
            overallScore: audit.auditResults.overallScore,
            timestamp: new Date().toISOString(),
            organization: audit.orgAlias,
            categoryScores: audit.auditResults.securityCategories,
            recommendationCounts: {
                critical: audit.auditResults.recommendations.critical.length,
                high: audit.auditResults.recommendations.high.length,
                medium: audit.auditResults.recommendations.medium.length,
                low: audit.auditResults.recommendations.low.length
            }
        };

        fs.writeFileSync(
            path.join(reportsDir, 'security-compliance-summary.json'),
            JSON.stringify(complianceSummary, null, 2)
        );
        console.log('📄 Compliance summary saved to reports/security-compliance-summary.json');

        console.log('\n🎉 Security Assessment Demo Completed Successfully!');
        console.log(`📊 Overall Security Score: ${audit.auditResults.overallScore.toFixed(2)}/10`);
        console.log(`📋 Total Recommendations: ${
            audit.auditResults.recommendations.critical.length +
            audit.auditResults.recommendations.high.length +
            audit.auditResults.recommendations.medium.length +
            audit.auditResults.recommendations.low.length
        }`);

        return audit.auditResults;

    } catch (error) {
        console.error('❌ Security assessment demo failed:', error);
        throw error;
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    runSecurityAssessmentDemo()
        .then(results => {
            console.log('\n✅ Demo completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Demo failed:', error);
            process.exit(1);
        });
}

module.exports = { runSecurityAssessmentDemo };
