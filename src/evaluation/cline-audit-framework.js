/**
 * Cline-based Salesforce Well-Architected Framework Audit System
 * 
 * This module replicates the Claude Code audit functionality within Cline/VS Code
 * Maintains the same 35-point evaluation framework with weighted scoring
 */

const fs = require('fs');
const path = require('path');

class SalesforceWellArchitectedAudit {
    constructor() {
        this.config = this.loadConfig();
        this.auditResults = {
            securityCategories: {},
            overallScore: 0,
            recommendations: [],
            actionPlan: {},
            complianceSummary: {}
        };

        // Pillar weights are now derived from the security categories in the config
        this.pillarWeights = {
            security: 1.0 // All weight is on security now
        };

        // Detailed evaluation criteria structure
        this.evaluationFramework = this.initializeFramework();
    }

    loadConfig() {
        const configPath = path.join(__dirname, '../../config/security-evaluation-config.json');
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error(`Error loading configuration file at ${configPath}:`, error);
            // Provide a default or throw an error, depending on desired behavior
            return {
                securityCategories: {
                    profilesAndPermissionSets: { name: "Profiles and Permission Sets", weight: 0.15, description: "" },
                    objectAndFieldLevelSecurity: { name: "Object and Field Level Security (OLS & FLS)", weight: 0.15, description: "" },
                    sharingAndVisibilitySettings: { name: "Sharing and Visibility Settings", weight: 0.15, description: "" },
                    customCodeAndMetadataAPI: { name: "Custom Code and Metadata API", weight: 0.15, description: "" },
                    publicAccessSettings: { name: "Public Access Settings", weight: 0.10, description: "" },
                    dataClassification: { name: "Data Classification", weight: 0.15, description: "" },
                    auditTrailsAndMonitoring: { name: "Audit Trails and Monitoring", weight: 0.15, description: "" }
                },
                scoringThresholds: {
                    critical: 0.20,
                    high: 0.40,
                    medium: 0.60,
                    low: 0.80
                }
            };
        }
    }

    initializeFramework() {
        const securityCategories = {};
        for (const key in this.config.securityCategories) {
            if (Object.hasOwnProperty.call(this.config.securityCategories, key)) {
                const category = this.config.securityCategories[key];
                securityCategories[key] = {
                    weight: category.weight,
                    criteria: [] // Criteria will be populated during evaluation
                };
            }
        }

        return {
            security: {
                weight: 1.0, // All weight on the single security pillar
                sections: securityCategories
            }
        };
    }

    /**
     * Utility function to execute Salesforce CLI commands
     * @param {string} command - The SF CLI command to execute
     * @returns {Promise<object>} - Parsed JSON output from the SF CLI command
     */
    async executeSfCliCommand(command) {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => { // Increased maxBuffer to 10MB
                if (error) {
                    console.error(`exec error: ${error}`);
                    console.error(`stderr: ${stderr}`);
                    return reject(error);
                }
                try {
                    // SF CLI commands often output JSON
                    resolve(JSON.parse(stdout));
                } catch (parseError) {
                    console.warn(`Could not parse SF CLI command output as JSON. Raw output: ${stdout}`);
                    resolve(stdout); // Resolve with raw output if not JSON
                }
            });
        });
    }

    /**
     * Execute comprehensive security audit using Cline capabilities
     */
    async executeAudit(salesforceOrgAlias) {
        console.log('🚀 Starting Salesforce Security Assessment with Cline');
        console.log(`📊 Evaluating org: ${salesforceOrgAlias}`);
        this.orgAlias = salesforceOrgAlias;
        
        try {
            // Phase 1: Data Collection
            await this.collectOrgData();
            
            // Phase 2: Evaluation
            await this.evaluateSecurityCategories();
            
            // Phase 3: Scoring
            this.calculateOverallScore();
            
            // Phase 4: Recommendations
            this.generateRecommendations();
            
            // Phase 5: Report Generation
            await this.generateReports();
            
            return this.auditResults;
            
        } catch (error) {
            console.error('❌ Security audit execution failed:', error);
            throw error;
        }
    }

    /**
     * Collect Salesforce org data using SF CLI integration
     */
    async collectOrgData() {
        console.log('📋 Collecting Salesforce org data...');
        
        this.orgData = {
            metadata: {},
            queryData: {}
        };

        // Collect security-relevant metadata
        this.orgData.metadata.profiles = await this.collectMetadata('Profile');
        this.orgData.metadata.permissionSets = await this.collectMetadata('PermissionSet');
        this.orgData.metadata.connectedApps = await this.collectMetadata('ConnectedApp');
        this.orgData.metadata.securitySettings = await this.collectMetadata('SecuritySettings');
        this.orgData.metadata.sharingRules = await this.collectMetadata('SharingRules');
        this.orgData.metadata.networkAccess = await this.collectMetadata('NetworkAccess'); // Example, adjust as needed
        this.orgData.metadata.namedCredentials = await this.collectMetadata('NamedCredential');
        this.orgData.metadata.customMetadataTypes = await this.collectMetadata('CustomMetadataType'); // For data classification
        this.orgData.metadata.apexClasses = await this.collectMetadata('ApexClass');
        this.orgData.metadata.visualforcePages = await this.collectMetadata('ApexPage');
        this.orgData.metadata.lightningComponents = await this.collectMetadata('LightningComponentBundle');

        // Collect comprehensive security-relevant query data
        this.orgData.queryData.users = await this.collectQueryData("SELECT Id, Name, Profile.Name, UserPermissionsConnectedApp, IsActive, LastLoginDate, FailedLoginAttempts, UserType, Email FROM User");
        this.orgData.queryData.profiles = await this.collectQueryData("SELECT Id, Name, PermissionsModifyAllData, PermissionsViewAllData, PermissionsViewAllUsers, PermissionsManageUsers, PermissionsViewSetup, PermissionsModifyMetadata FROM Profile");
        this.orgData.queryData.permissionSetAssignments = await this.collectQueryData("SELECT Id, Assignee.Name, PermissionSet.Name, PermissionSet.Type FROM PermissionSetAssignment");
        this.orgData.queryData.loginHistory = await this.collectQueryData("SELECT Id, UserId, LoginTime, LoginType, SourceIp, Status, Browser, Platform FROM LoginHistory ORDER BY LoginTime DESC LIMIT 2000");
        this.orgData.queryData.objectPermissions = await this.collectQueryData("SELECT Parent.Name, SobjectType, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords FROM ObjectPermissions WHERE Parent.IsOwnedByProfile = true OR Parent.IsOwnedByPermissionSet = true");
        this.orgData.queryData.fieldPermissions = await this.collectQueryData("SELECT Parent.Name, SobjectType, Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE Parent.IsOwnedByProfile = true OR Parent.IsOwnedByPermissionSet = true");
        
        // Enhanced ConnectedApp security queries to detect potential data theft risks
        this.orgData.queryData.connectedApps = await this.collectQueryData("SELECT Id, Name, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, OptionsAllowAdminApprovedUsersOnly, OptionsHasSessionLevelPolicy, OptionsRefreshTokenValidityMetric, RefreshTokenValidityPeriod FROM ConnectedApp");
        this.orgData.queryData.connectedAppOAuthTokens = await this.collectQueryData("SELECT Id, AppName, UserId, User.Name, User.Profile.Name, CreatedDate, LastUsedDate, UseCount FROM ConnectedApplication WHERE LastUsedDate != null ORDER BY LastUsedDate DESC LIMIT 1000");
        this.orgData.queryData.oauthTokens = await this.collectQueryData("SELECT Id, AppName, UserId, User.Name, CreatedDate, LastUsedDate, UseCount FROM OauthToken ORDER BY LastUsedDate DESC LIMIT 500");
        
        // Additional comprehensive security data collection
        this.orgData.queryData.setupAuditTrail = await this.collectQueryData("SELECT Id, Action, Section, CreatedBy.Name, CreatedDate, Display FROM SetupAuditTrail ORDER BY CreatedDate DESC LIMIT 1000");
        this.orgData.queryData.apiUsage = await this.collectQueryData("SELECT Id, RequestIdentifier, Url, Method, Status, RunTime, CreatedDate FROM ApiEvent ORDER BY CreatedDate DESC LIMIT 500");
        this.orgData.queryData.dataExport = await this.collectQueryData("SELECT Id, ExportedBy.Name, ExportedDate, Status, Type FROM DataExport ORDER BY ExportedDate DESC LIMIT 100");
        this.orgData.queryData.emailMessages = await this.collectQueryData("SELECT Id, Subject, FromAddress, ToAddress, CreatedDate, Status FROM EmailMessage WHERE CreatedDate = LAST_N_DAYS:30 LIMIT 500");
        this.orgData.queryData.contentDocuments = await this.collectQueryData("SELECT Id, Title, FileType, ContentSize, CreatedBy.Name, CreatedDate, IsPublic FROM ContentDocument WHERE CreatedDate = LAST_N_DAYS:30 ORDER BY ContentSize DESC LIMIT 200");
        this.orgData.queryData.networkMembers = await this.collectQueryData("SELECT Id, MemberId, Member.Name, NetworkId, Network.Name FROM NetworkMember LIMIT 500");
        this.orgData.queryData.domainSites = await this.collectQueryData("SELECT Id, Domain, Subdomain, PathPrefix, SiteType FROM Domain LIMIT 100");
        this.orgData.queryData.cspTrustedSites = await this.collectQueryData("SELECT Id, EndpointUrl, Description, IsActive FROM CspTrustedSite");
        this.orgData.queryData.remoteSiteSettings = await this.collectQueryData("SELECT Id, SiteName, EndpointUrl, Description, IsActive FROM RemoteSiteSetting");
        this.orgData.queryData.namedCredentials = await this.collectQueryData("SELECT Id, DeveloperName, Endpoint, PrincipalType FROM NamedCredential");
        this.orgData.queryData.externalDataSources = await this.collectQueryData("SELECT Id, DeveloperName, Endpoint, Protocol, Type FROM ExternalDataSource");
        this.orgData.queryData.authProviders = await this.collectQueryData("SELECT Id, DeveloperName, ProviderType, AuthorizeUrl, TokenUrl FROM AuthProvider");
        this.orgData.queryData.singleSignOnSettings = await this.collectQueryData("SELECT Id, Name, Issuer, AttributeFormat, IsActive FROM SamlSsoConfig");
        this.orgData.queryData.myDomainSettings = await this.collectQueryData("SELECT Id, Domain, DomainType FROM Domain WHERE DomainType = 'MyDomain'");
        this.orgData.queryData.certificateAndKeyManagement = await this.collectQueryData("SELECT Id, DeveloperName, KeySize, ExpirationDate FROM Certificate");
    }

    async collectMetadata(metadataType) {
        console.log(`Retrieving ${metadataType} metadata...`);
        // Using sf project retrieve for specific metadata types
        const command = `sf project retrieve start --target-metadata-dir temp_metadata --metadata ${metadataType} --target-org ${this.orgAlias} --json`;
        try {
            const result = await this.executeSfCliCommand(command);
            // For retrieve, the actual metadata content needs to be read from the temp_metadata directory
            // This is a simplified placeholder. In a real scenario, you'd parse the retrieved files.
            return { status: 'success', type: metadataType, data: result };
        } catch (error) {
            console.error(`Error retrieving ${metadataType} metadata:`, error);
            return { status: 'error', type: metadataType, error: error.message };
        }
    }

    async collectQueryData(soqlQuery) {
        console.log(`Executing SOQL query: ${soqlQuery.substring(0, 50)}...`);
        const command = `sf data query --query "${soqlQuery}" --target-org ${this.orgAlias} --json`;
        try {
            const result = await this.executeSfCliCommand(command);
            return result.result.records; // SF CLI query output structure
        } catch (error) {
            console.error(`Error executing SOQL query:`, error);
            return { status: 'error', query: soqlQuery, error: error.message };
        }
    }

    /**
     * Evaluate all security categories
     */
    async evaluateSecurityCategories() {
        console.log('🔍 Evaluating security categories...');
        
        const securityResults = {};
        for (const categoryKey in this.config.securityCategories) {
            if (Object.hasOwnProperty.call(this.config.securityCategories, categoryKey)) {
                const categoryName = this.config.securityCategories[categoryKey].name;
                console.log(`Evaluating ${categoryName}...`);
                let score = 0;
                let details = [];

                switch (categoryKey) {
                    case 'profilesAndPermissionSets':
                        ({ score, details } = this.evaluateProfilesAndPermissionSets());
                        break;
                    case 'objectAndFieldLevelSecurity':
                        ({ score, details } = this.evaluateObjectAndFieldLevelSecurity());
                        break;
                    case 'sharingAndVisibilitySettings':
                        ({ score, details } = this.evaluateSharingAndVisibilitySettings());
                        break;
                    case 'customCodeAndMetadataAPI':
                        ({ score, details } = this.evaluateCustomCodeAndMetadataAPI());
                        break;
                    case 'publicAccessSettings':
                        ({ score, details } = this.evaluatePublicAccessSettings());
                        break;
                    case 'dataClassification':
                        ({ score, details } = this.evaluateDataClassification());
                        break;
                    case 'auditTrailsAndMonitoring':
                        ({ score, details } = this.evaluateAuditTrailsAndMonitoring());
                        break;
                    default:
                        score = 0;
                        details = [`No evaluation logic found for category: ${categoryName}`];
                }
                securityResults[categoryKey] = { score, details };
            }
        }
        this.auditResults.securityCategories = securityResults;
    }

    /**
     * Placeholder evaluation methods for each security category
     * These would contain the actual evaluation logic based on collected data
     */
    evaluateProfilesAndPermissionSets() {
        // Handle potential query errors by ensuring we have arrays
        const profiles = Array.isArray(this.orgData.queryData.profiles) ? this.orgData.queryData.profiles : [];
        const connectedAppsQuery = Array.isArray(this.orgData.queryData.connectedApps) ? this.orgData.queryData.connectedApps : [];
        const oauthTokens = Array.isArray(this.orgData.queryData.oauthTokens) ? this.orgData.queryData.oauthTokens : [];
        const connectedAppTokens = Array.isArray(this.orgData.queryData.connectedAppOAuthTokens) ? this.orgData.queryData.connectedAppOAuthTokens : [];
        
        const highPrivilegeProfiles = profiles.filter(p => p.PermissionsModifyAllData || p.PermissionsViewAllData);

        let score = 10; // Start with a perfect score
        let details = [];
        let securityRisks = [];

        // Analyze high privilege profiles
        if (highPrivilegeProfiles.length > 0) {
            score -= 2 * highPrivilegeProfiles.length;
            details.push(`🚨 SECURITY RISK: Found ${highPrivilegeProfiles.length} profiles with ModifyAllData or ViewAllData permissions: ${highPrivilegeProfiles.map(p => p.Name).join(', ')}`);
            securityRisks.push('High privilege profiles detected');
        } else {
            details.push('✅ No profiles found with ModifyAllData or ViewAllData permissions.');
        }

        // Analyze ConnectedApp security risks for data theft
        if (connectedAppsQuery.length > 0) {
            details.push(`📱 Found ${connectedAppsQuery.length} Connected Apps in organization`);
            
            // Check for apps without admin approval requirement (high risk for data theft)
            const unapprovedApps = connectedAppsQuery.filter(app => !app.OptionsAllowAdminApprovedUsersOnly);
            if (unapprovedApps.length > 0) {
                score -= 3; // Major security risk
                details.push(`🚨 CRITICAL RISK: ${unapprovedApps.length} Connected Apps allow user self-authorization without admin approval:`);
                unapprovedApps.forEach(app => {
                    details.push(`  - ${app.Name} (Created: ${app.CreatedDate}, By: ${app.CreatedBy?.Name || 'Unknown'})`);
                });
                securityRisks.push('Connected Apps without admin approval detected');
            }

            // Check for apps without session-level policies
            const noSessionPolicyApps = connectedAppsQuery.filter(app => !app.OptionsHasSessionLevelPolicy);
            if (noSessionPolicyApps.length > 0) {
                score -= 1;
                details.push(`⚠️ WARNING: ${noSessionPolicyApps.length} Connected Apps lack session-level security policies`);
                securityRisks.push('Connected Apps without session policies');
            }

            // Check for apps with long-lived refresh tokens (potential for persistent access)
            const longLivedTokenApps = connectedAppsQuery.filter(app => 
                app.RefreshTokenValidityPeriod && parseInt(app.RefreshTokenValidityPeriod) > 7776000 // > 90 days
            );
            if (longLivedTokenApps.length > 0) {
                score -= 2;
                details.push(`⚠️ RISK: ${longLivedTokenApps.length} Connected Apps have long-lived refresh tokens (>90 days):`);
                longLivedTokenApps.forEach(app => {
                    const days = Math.round(parseInt(app.RefreshTokenValidityPeriod) / 86400);
                    details.push(`  - ${app.Name}: ${days} days token validity`);
                });
                securityRisks.push('Long-lived refresh tokens detected');
            }

            // Analyze recently created apps (potential indicators of malicious apps)
            const recentApps = connectedAppsQuery.filter(app => {
                const createdDate = new Date(app.CreatedDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdDate > thirtyDaysAgo;
            });
            if (recentApps.length > 0) {
                details.push(`📅 ${recentApps.length} Connected Apps created in last 30 days - review for legitimacy:`);
                recentApps.forEach(app => {
                    details.push(`  - ${app.Name} (Created: ${app.CreatedDate}, By: ${app.CreatedBy?.Name || 'Unknown'})`);
                });
            }

        } else {
            details.push('✅ No Connected Apps found in organization.');
        }

        // Analyze OAuth token usage patterns for suspicious activity
        if (oauthTokens.length > 0) {
            details.push(`🔑 Found ${oauthTokens.length} active OAuth tokens`);
            
            // Check for high-usage tokens (potential data exfiltration)
            const highUsageTokens = oauthTokens.filter(token => token.UseCount && token.UseCount > 1000);
            if (highUsageTokens.length > 0) {
                score -= 1;
                details.push(`⚠️ ${highUsageTokens.length} OAuth tokens with high usage (>1000 uses) - monitor for data exfiltration:`);
                highUsageTokens.forEach(token => {
                    details.push(`  - ${token.AppName}: ${token.UseCount} uses by ${token.User?.Name || 'Unknown'}`);
                });
                securityRisks.push('High-usage OAuth tokens detected');
            }

            // Check for recently active tokens from external apps
            const recentlyActiveTokens = oauthTokens.filter(token => {
                if (!token.LastUsedDate) return false;
                const lastUsed = new Date(token.LastUsedDate);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return lastUsed > sevenDaysAgo;
            });
            if (recentlyActiveTokens.length > 0) {
                details.push(`📊 ${recentlyActiveTokens.length} OAuth tokens used in last 7 days - verify legitimate business use`);
            }
        }

        // Generate security recommendations based on findings
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('Connected Apps without admin approval detected')) {
                details.push(`  • Enable "Admin approved users are pre-authorized" for all Connected Apps`);
                details.push(`  • Review and audit all Connected App permissions and scopes`);
            }
            if (securityRisks.includes('High-usage OAuth tokens detected')) {
                details.push(`  • Monitor OAuth token usage patterns for anomalies`);
                details.push(`  • Implement token rotation policies`);
            }
            if (securityRisks.includes('Long-lived refresh tokens detected')) {
                details.push(`  • Reduce refresh token validity periods to maximum 30 days`);
                details.push(`  • Implement regular token auditing and cleanup`);
            }
        }

        score = Math.max(0, score); // Ensure score doesn't go below 0
        return { score, details };
    }

    evaluateObjectAndFieldLevelSecurity() {
        // Handle potential query errors by ensuring we have arrays
        const objectPermissions = Array.isArray(this.orgData.queryData.objectPermissions) ? this.orgData.queryData.objectPermissions : [];
        const fieldPermissions = Array.isArray(this.orgData.queryData.fieldPermissions) ? this.orgData.queryData.fieldPermissions : [];
        const profiles = Array.isArray(this.orgData.queryData.profiles) ? this.orgData.queryData.profiles : [];

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Check for overly permissive object permissions
        const overlyPermissiveObjects = objectPermissions.filter(op => op.PermissionsModifyAllRecords || op.PermissionsViewAllRecords);
        if (overlyPermissiveObjects.length > 0) {
            score -= Math.min(3, overlyPermissiveObjects.length * 0.5);
            details.push(`🚨 SECURITY RISK: Found ${overlyPermissiveObjects.length} profiles/permission sets with "View All" or "Modify All" object permissions`);
            
            // Group by object type for better reporting
            const objectTypes = {};
            overlyPermissiveObjects.forEach(op => {
                if (!objectTypes[op.SobjectType]) objectTypes[op.SobjectType] = [];
                objectTypes[op.SobjectType].push(op.Parent.Name);
            });
            
            Object.entries(objectTypes).forEach(([objType, parents]) => {
                details.push(`  - ${objType}: ${parents.join(', ')}`);
            });
            securityRisks.push('Overly permissive object access detected');
        }

        // Check for sensitive objects with broad access
        const sensitiveObjects = ['Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'User', 'Profile'];
        const sensitiveObjectPermissions = objectPermissions.filter(op => 
            sensitiveObjects.includes(op.SobjectType) && 
            (op.PermissionsRead || op.PermissionsEdit || op.PermissionsDelete)
        );

        if (sensitiveObjectPermissions.length > 0) {
            details.push(`📊 Found ${sensitiveObjectPermissions.length} permissions on sensitive objects (Account, Contact, etc.)`);
            
            // Check for delete permissions on sensitive objects
            const deletePermissions = sensitiveObjectPermissions.filter(op => op.PermissionsDelete);
            if (deletePermissions.length > 0) {
                score -= 1;
                details.push(`⚠️ WARNING: ${deletePermissions.length} profiles/permission sets have DELETE access to sensitive objects`);
                securityRisks.push('Delete permissions on sensitive objects');
            }
        }

        // Analyze field-level security gaps
        if (fieldPermissions.length > 0) {
            details.push(`🔒 Analyzing ${fieldPermissions.length} field-level security settings`);
            
            // Check for sensitive fields with broad edit access
            const sensitiveFieldPatterns = ['SSN', 'Social', 'Credit', 'Salary', 'Phone', 'Email', 'Address'];
            const sensitiveFieldPermissions = fieldPermissions.filter(fp => 
                fp.PermissionsEdit && 
                sensitiveFieldPatterns.some(pattern => fp.Field.toLowerCase().includes(pattern.toLowerCase()))
            );

            if (sensitiveFieldPermissions.length > 0) {
                score -= 1;
                details.push(`⚠️ WARNING: ${sensitiveFieldPermissions.length} potentially sensitive fields have broad edit access`);
                sensitiveFieldPermissions.slice(0, 5).forEach(fp => {
                    details.push(`  - ${fp.SobjectType}.${fp.Field} (${fp.Parent.Name})`);
                });
                if (sensitiveFieldPermissions.length > 5) {
                    details.push(`  - ... and ${sensitiveFieldPermissions.length - 5} more`);
                }
                securityRisks.push('Sensitive fields with broad access');
            }
        } else {
            details.push('⚠️ No field-level security data available - ensure FLS is properly configured');
            score -= 1;
        }

        // Check for profiles with metadata permissions
        const metadataProfiles = profiles.filter(p => p.PermissionsModifyMetadata || p.PermissionsViewSetup);
        if (metadataProfiles.length > 0) {
            details.push(`🔧 Found ${metadataProfiles.length} profiles with metadata/setup access:`);
            metadataProfiles.forEach(p => {
                const permissions = [];
                if (p.PermissionsModifyMetadata) permissions.push('Modify Metadata');
                if (p.PermissionsViewSetup) permissions.push('View Setup');
                details.push(`  - ${p.Name}: ${permissions.join(', ')}`);
            });
            
            if (metadataProfiles.length > 3) {
                score -= 1;
                details.push(`⚠️ WARNING: Consider limiting metadata access to essential admin profiles only`);
                securityRisks.push('Excessive metadata access permissions');
            }
        }

        // Generate recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('Overly permissive object access detected')) {
                details.push(`  • Review and restrict "View All" and "Modify All" permissions`);
                details.push(`  • Implement role-based access with sharing rules instead`);
            }
            if (securityRisks.includes('Sensitive fields with broad access')) {
                details.push(`  • Implement field-level security for sensitive data fields`);
                details.push(`  • Use permission sets for granular field access control`);
            }
            if (securityRisks.includes('Excessive metadata access permissions')) {
                details.push(`  • Limit setup and metadata permissions to system administrators`);
                details.push(`  • Create separate admin profiles for different responsibilities`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    evaluateSharingAndVisibilitySettings() {
        const namedCredentials = this.orgData.queryData.namedCredentials || [];
        const externalDataSources = this.orgData.queryData.externalDataSources || [];
        const authProviders = this.orgData.queryData.authProviders || [];
        const singleSignOnSettings = this.orgData.queryData.singleSignOnSettings || [];
        const myDomainSettings = this.orgData.queryData.myDomainSettings || [];

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Analyze Named Credentials for security risks
        if (namedCredentials.length > 0) {
            details.push(`🔐 Found ${namedCredentials.length} Named Credentials`);
            
            // Check for insecure endpoints
            const insecureCredentials = namedCredentials.filter(cred => 
                cred.Endpoint && cred.Endpoint.startsWith('http://')
            );
            
            if (insecureCredentials.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${insecureCredentials.length} Named Credentials using insecure HTTP:`);
                insecureCredentials.forEach(cred => {
                    details.push(`  - ${cred.DeveloperName}: ${cred.Endpoint}`);
                });
                securityRisks.push('Insecure Named Credentials detected');
            }
            
            // Analyze principal types for security
            const principalTypes = {};
            namedCredentials.forEach(cred => {
                const type = cred.PrincipalType || 'Unknown';
                if (!principalTypes[type]) principalTypes[type] = 0;
                principalTypes[type]++;
            });
            
            Object.entries(principalTypes).forEach(([type, count]) => {
                details.push(`  - ${type}: ${count} credentials`);
            });
            
            // Check for potentially risky principal types
            if (principalTypes['Anonymous'] > 0) {
                score -= 1;
                details.push(`⚠️ WARNING: ${principalTypes['Anonymous']} anonymous Named Credentials - review security implications`);
                securityRisks.push('Anonymous Named Credentials');
            }
        }

        // Analyze External Data Sources
        if (externalDataSources.length > 0) {
            details.push(`🌐 Found ${externalDataSources.length} External Data Sources`);
            
            // Check for insecure endpoints
            const insecureDataSources = externalDataSources.filter(ds => 
                ds.Endpoint && ds.Endpoint.startsWith('http://')
            );
            
            if (insecureDataSources.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${insecureDataSources.length} External Data Sources using insecure HTTP`);
                securityRisks.push('Insecure External Data Sources');
            }
            
            // Analyze protocols and types
            const protocols = {};
            const types = {};
            externalDataSources.forEach(ds => {
                const protocol = ds.Protocol || 'Unknown';
                const type = ds.Type || 'Unknown';
                if (!protocols[protocol]) protocols[protocol] = 0;
                if (!types[type]) types[type] = 0;
                protocols[protocol]++;
                types[type]++;
            });
            
            details.push(`  - Protocols: ${Object.entries(protocols).map(([p, c]) => `${p}(${c})`).join(', ')}`);
            details.push(`  - Types: ${Object.entries(types).map(([t, c]) => `${t}(${c})`).join(', ')}`);
        }

        // Analyze Authentication Providers
        if (authProviders.length > 0) {
            details.push(`🔑 Found ${authProviders.length} Authentication Providers`);
            
            // Check for insecure OAuth endpoints
            const insecureAuthProviders = authProviders.filter(ap => 
                (ap.AuthorizeUrl && ap.AuthorizeUrl.startsWith('http://')) ||
                (ap.TokenUrl && ap.TokenUrl.startsWith('http://'))
            );
            
            if (insecureAuthProviders.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${insecureAuthProviders.length} Auth Providers with insecure HTTP endpoints`);
                securityRisks.push('Insecure Authentication Providers');
            }
            
            // Analyze provider types
            const providerTypes = {};
            authProviders.forEach(ap => {
                const type = ap.ProviderType || 'Unknown';
                if (!providerTypes[type]) providerTypes[type] = 0;
                providerTypes[type]++;
            });
            
            Object.entries(providerTypes).forEach(([type, count]) => {
                details.push(`  - ${type}: ${count} providers`);
            });
        }

        // Analyze Single Sign-On Settings
        if (singleSignOnSettings.length > 0) {
            details.push(`🔐 Found ${singleSignOnSettings.length} SAML SSO configurations`);
            
            const activeSSO = singleSignOnSettings.filter(sso => sso.IsActive);
            details.push(`  - ${activeSSO.length} active SSO configurations`);
            
            if (activeSSO.length > 0) {
                details.push(`✅ SSO configurations detected - good for centralized authentication`);
                
                // Check for proper attribute formats
                const attributeFormats = {};
                activeSSO.forEach(sso => {
                    const format = sso.AttributeFormat || 'Unknown';
                    if (!attributeFormats[format]) attributeFormats[format] = 0;
                    attributeFormats[format]++;
                });
                
                Object.entries(attributeFormats).forEach(([format, count]) => {
                    details.push(`  - ${format} format: ${count} configurations`);
                });
            }
        } else {
            details.push(`⚠️ No SAML SSO configurations found - consider implementing for enhanced security`);
            score -= 1;
        }

        // Analyze My Domain Settings
        if (myDomainSettings.length > 0) {
            details.push(`🌐 Found ${myDomainSettings.length} My Domain configurations`);
            details.push(`✅ My Domain is configured - good for security and branding`);
        } else {
            score -= 2;
            details.push(`🚨 CRITICAL: My Domain not configured - this is a significant security risk`);
            securityRisks.push('My Domain not configured');
        }

        // Generate recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('My Domain not configured')) {
                details.push(`  • Configure My Domain immediately for enhanced security`);
                details.push(`  • My Domain prevents session hijacking and phishing attacks`);
                details.push(`  • Required for many advanced security features`);
            }
            if (securityRisks.includes('Insecure Named Credentials detected')) {
                details.push(`  • Update all Named Credentials to use HTTPS endpoints`);
                details.push(`  • Review and rotate credentials for HTTP endpoints`);
            }
            if (securityRisks.includes('Insecure External Data Sources')) {
                details.push(`  • Update External Data Sources to use secure protocols`);
                details.push(`  • Review data access patterns for external sources`);
            }
            if (securityRisks.includes('Anonymous Named Credentials')) {
                details.push(`  • Review anonymous Named Credentials for security implications`);
                details.push(`  • Consider using authenticated credentials where possible`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    evaluateCustomCodeAndMetadataAPI() {
        const certificateAndKeyManagement = this.orgData.queryData.certificateAndKeyManagement || [];
        const apexClasses = this.orgData.metadata.apexClasses || {};
        const visualforcePages = this.orgData.metadata.visualforcePages || {};
        const lightningComponents = this.orgData.metadata.lightningComponents || {};

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Analyze Certificate and Key Management
        if (certificateAndKeyManagement.length > 0) {
            details.push(`🔐 Found ${certificateAndKeyManagement.length} certificates`);
            
            // Check for expiring certificates
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
            const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
            
            const expiringCertificates = certificateAndKeyManagement.filter(cert => {
                if (!cert.ExpirationDate) return false;
                const expDate = new Date(cert.ExpirationDate);
                return expDate <= ninetyDaysFromNow;
            });
            
            if (expiringCertificates.length > 0) {
                const criticallyExpiring = expiringCertificates.filter(cert => {
                    const expDate = new Date(cert.ExpirationDate);
                    return expDate <= thirtyDaysFromNow;
                });
                
                if (criticallyExpiring.length > 0) {
                    score -= 2;
                    details.push(`🚨 CRITICAL: ${criticallyExpiring.length} certificates expiring within 30 days:`);
                    criticallyExpiring.forEach(cert => {
                        details.push(`  - ${cert.DeveloperName}: expires ${cert.ExpirationDate}`);
                    });
                    securityRisks.push('Certificates expiring soon');
                } else {
                    score -= 1;
                    details.push(`⚠️ WARNING: ${expiringCertificates.length} certificates expiring within 90 days`);
                    securityRisks.push('Certificates expiring within 90 days');
                }
            }
            
            // Check key sizes for security
            const weakKeyCertificates = certificateAndKeyManagement.filter(cert => 
                cert.KeySize && parseInt(cert.KeySize) < 2048
            );
            
            if (weakKeyCertificates.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${weakKeyCertificates.length} certificates with weak key sizes (<2048 bits)`);
                securityRisks.push('Weak certificate key sizes');
            }
            
            // Analyze key size distribution
            const keySizes = {};
            certificateAndKeyManagement.forEach(cert => {
                const size = cert.KeySize || 'Unknown';
                if (!keySizes[size]) keySizes[size] = 0;
                keySizes[size]++;
            });
            
            Object.entries(keySizes).forEach(([size, count]) => {
                details.push(`  - ${size}-bit keys: ${count} certificates`);
            });
            
        } else {
            details.push(`⚠️ No certificates found - may impact secure integrations`);
            score -= 1;
        }

        // Analyze Apex Classes (metadata analysis)
        if (apexClasses.status === 'success') {
            details.push(`⚡ Apex classes metadata retrieved for security analysis`);
            // In a real implementation, you would parse the Apex class files to check for:
            // - SOQL injection vulnerabilities
            // - Hardcoded credentials
            // - Insufficient access controls
            // - Unsafe dynamic SOQL/DML
            details.push(`📋 Custom code security analysis requires metadata file parsing`);
        } else {
            details.push(`⚠️ Unable to retrieve Apex classes metadata - may impact code security assessment`);
            score -= 1;
        }

        // Analyze Visualforce Pages (metadata analysis)
        if (visualforcePages.status === 'success') {
            details.push(`📄 Visualforce pages metadata retrieved for security analysis`);
            // In a real implementation, you would parse VF pages to check for:
            // - XSS vulnerabilities
            // - CSRF protection
            // - Proper escaping
            // - Insecure direct object references
            details.push(`📋 Visualforce security analysis requires metadata file parsing`);
        } else {
            details.push(`⚠️ Unable to retrieve Visualforce pages metadata`);
        }

        // Analyze Lightning Components (metadata analysis)
        if (lightningComponents.status === 'success') {
            details.push(`⚡ Lightning components metadata retrieved for security analysis`);
            // In a real implementation, you would parse Lightning components to check for:
            // - Insecure component communication
            // - Client-side security issues
            // - Improper data handling
            // - CSP violations
            details.push(`📋 Lightning component security analysis requires metadata file parsing`);
        } else {
            details.push(`⚠️ Unable to retrieve Lightning components metadata`);
        }

        // General custom code security recommendations
        details.push(`🔍 CUSTOM CODE SECURITY CONSIDERATIONS:`);
        details.push(`  • Implement static code analysis tools (PMD, SonarQube)`);
        details.push(`  • Regular security code reviews for custom development`);
        details.push(`  • Follow Salesforce secure coding guidelines`);
        details.push(`  • Use platform security features (sharing, FLS, CRUD)`);

        // Generate specific recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('Certificates expiring soon')) {
                details.push(`  • Renew expiring certificates immediately`);
                details.push(`  • Set up certificate expiration monitoring`);
                details.push(`  • Plan certificate renewal process`);
            }
            if (securityRisks.includes('Weak certificate key sizes')) {
                details.push(`  • Replace certificates with weak key sizes (use 2048+ bit keys)`);
                details.push(`  • Review all certificate security configurations`);
                details.push(`  • Implement certificate security standards`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    evaluatePublicAccessSettings() {
        const networkMembers = this.orgData.queryData.networkMembers || [];
        const domainSites = this.orgData.queryData.domainSites || [];
        const cspTrustedSites = this.orgData.queryData.cspTrustedSites || [];
        const remoteSiteSettings = this.orgData.queryData.remoteSiteSettings || [];
        const contentDocuments = this.orgData.queryData.contentDocuments || [];

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Analyze public sites and communities
        if (domainSites.length > 0) {
            details.push(`🌐 Found ${domainSites.length} domain/site configurations`);
            
            // Check for public sites
            const publicSites = domainSites.filter(site => 
                site.SiteType && (site.SiteType.includes('Public') || site.SiteType.includes('Community'))
            );
            
            if (publicSites.length > 0) {
                details.push(`🔓 Found ${publicSites.length} public-facing sites:`);
                publicSites.forEach(site => {
                    details.push(`  - ${site.Domain}${site.Subdomain ? '.' + site.Subdomain : ''}${site.PathPrefix || ''} (${site.SiteType})`);
                });
                
                if (publicSites.length > 3) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Multiple public sites increase attack surface - ensure proper security controls`);
                    securityRisks.push('Multiple public sites detected');
                }
            }
        }

        // Analyze community/network members
        if (networkMembers.length > 0) {
            details.push(`👥 Found ${networkMembers.length} community/network members`);
            
            // Group by network to understand community structure
            const membersByNetwork = {};
            networkMembers.forEach(member => {
                const networkName = member.Network?.Name || 'Unknown Network';
                if (!membersByNetwork[networkName]) membersByNetwork[networkName] = 0;
                membersByNetwork[networkName]++;
            });
            
            Object.entries(membersByNetwork).forEach(([network, count]) => {
                details.push(`  - ${network}: ${count} members`);
            });
            
            // Check for large external communities (potential security risk)
            const largeNetworks = Object.entries(membersByNetwork).filter(([network, count]) => count > 100);
            if (largeNetworks.length > 0) {
                details.push(`📊 Large external communities detected - ensure proper access controls`);
                if (largeNetworks.some(([network, count]) => count > 500)) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Very large external communities (>500 members) require enhanced monitoring`);
                    securityRisks.push('Large external communities');
                }
            }
        }

        // Analyze CSP trusted sites for potential security risks
        if (cspTrustedSites.length > 0) {
            details.push(`🔒 Found ${cspTrustedSites.length} CSP trusted sites`);
            
            // Check for overly permissive CSP settings
            const activeTrustedSites = cspTrustedSites.filter(site => site.IsActive);
            details.push(`  - ${activeTrustedSites.length} active trusted sites`);
            
            // Check for wildcard or overly broad trusted sites
            const broadTrustedSites = activeTrustedSites.filter(site => 
                site.EndpointUrl && (
                    site.EndpointUrl.includes('*') || 
                    site.EndpointUrl.includes('http://') ||
                    site.EndpointUrl === 'https://*'
                )
            );
            
            if (broadTrustedSites.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${broadTrustedSites.length} overly permissive CSP trusted sites:`);
                broadTrustedSites.forEach(site => {
                    details.push(`  - ${site.EndpointUrl} (${site.Description || 'No description'})`);
                });
                securityRisks.push('Overly permissive CSP settings');
            }
            
            if (activeTrustedSites.length > 20) {
                score -= 1;
                details.push(`⚠️ WARNING: Large number of trusted sites (${activeTrustedSites.length}) - review necessity`);
                securityRisks.push('Excessive trusted sites');
            }
        }

        // Analyze remote site settings
        if (remoteSiteSettings.length > 0) {
            details.push(`🌍 Found ${remoteSiteSettings.length} remote site settings`);
            
            const activeRemoteSites = remoteSiteSettings.filter(site => site.IsActive);
            details.push(`  - ${activeRemoteSites.length} active remote sites`);
            
            // Check for HTTP (non-HTTPS) remote sites
            const insecureRemoteSites = activeRemoteSites.filter(site => 
                site.EndpointUrl && site.EndpointUrl.startsWith('http://')
            );
            
            if (insecureRemoteSites.length > 0) {
                score -= 2;
                details.push(`🚨 SECURITY RISK: ${insecureRemoteSites.length} remote sites using insecure HTTP:`);
                insecureRemoteSites.forEach(site => {
                    details.push(`  - ${site.SiteName}: ${site.EndpointUrl}`);
                });
                securityRisks.push('Insecure HTTP remote sites');
            }
            
            // Check for wildcard or overly broad remote sites
            const broadRemoteSites = activeRemoteSites.filter(site => 
                site.EndpointUrl && site.EndpointUrl.includes('*')
            );
            
            if (broadRemoteSites.length > 0) {
                score -= 1;
                details.push(`⚠️ WARNING: ${broadRemoteSites.length} remote sites with wildcard endpoints`);
                securityRisks.push('Wildcard remote site endpoints');
            }
        }

        // Analyze public content documents
        if (contentDocuments.length > 0) {
            const publicDocuments = contentDocuments.filter(doc => doc.IsPublic);
            
            if (publicDocuments.length > 0) {
                details.push(`📄 Found ${publicDocuments.length} public content documents`);
                
                // Check for large public files (potential data exposure)
                const largePublicDocs = publicDocuments.filter(doc => doc.ContentSize > 10485760); // > 10MB
                if (largePublicDocs.length > 0) {
                    score -= 1;
                    details.push(`⚠️ WARNING: ${largePublicDocs.length} large public files (>10MB) - review for sensitive data:`);
                    largePublicDocs.slice(0, 3).forEach(doc => {
                        const sizeMB = (doc.ContentSize / 1048576).toFixed(1);
                        details.push(`  - ${doc.Title} (${sizeMB}MB, ${doc.FileType})`);
                    });
                    securityRisks.push('Large public files detected');
                }
                
                // Check for potentially sensitive file types
                const sensitiveFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
                const sensitivePubicDocs = publicDocuments.filter(doc => 
                    doc.FileType && sensitiveFileTypes.includes(doc.FileType.toLowerCase())
                );
                
                if (sensitivePubicDocs.length > 0) {
                    details.push(`📋 ${sensitivePubicDocs.length} public documents with potentially sensitive file types`);
                    if (sensitivePubicDocs.length > 10) {
                        score -= 1;
                        details.push(`⚠️ WARNING: High number of public sensitive documents - review access controls`);
                        securityRisks.push('Many public sensitive documents');
                    }
                }
            } else {
                details.push(`✅ No public content documents found`);
            }
        }

        // Generate recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('Overly permissive CSP settings')) {
                details.push(`  • Review and restrict CSP trusted sites to specific domains`);
                details.push(`  • Remove wildcard (*) entries from CSP trusted sites`);
                details.push(`  • Ensure all trusted sites use HTTPS`);
            }
            if (securityRisks.includes('Insecure HTTP remote sites')) {
                details.push(`  • Update all remote sites to use HTTPS endpoints`);
                details.push(`  • Review necessity of each remote site connection`);
            }
            if (securityRisks.includes('Large public files detected')) {
                details.push(`  • Review large public files for sensitive data exposure`);
                details.push(`  • Implement file access controls and monitoring`);
                details.push(`  • Consider moving large files to secure storage`);
            }
            if (securityRisks.includes('Large external communities')) {
                details.push(`  • Implement enhanced monitoring for large communities`);
                details.push(`  • Review community member access and permissions`);
                details.push(`  • Set up alerts for unusual community activity`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    evaluateDataClassification() {
        const contentDocuments = this.orgData.queryData.contentDocuments || [];
        const emailMessages = this.orgData.queryData.emailMessages || [];
        const fieldPermissions = this.orgData.queryData.fieldPermissions || [];
        const customMetadataTypes = this.orgData.metadata.customMetadataTypes || {};

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Check for data classification implementation
        if (customMetadataTypes.status === 'success') {
            details.push(`📋 Custom metadata types available for data classification framework`);
            // In a real implementation, you would parse the metadata files to check for classification schemas
        } else {
            details.push(`⚠️ Unable to retrieve custom metadata types - may impact data classification assessment`);
            score -= 1;
        }

        // Analyze content documents for potential sensitive data
        if (contentDocuments.length > 0) {
            details.push(`📄 Analyzing ${contentDocuments.length} recent content documents for data classification`);
            
            // Check for potentially sensitive file types
            const sensitiveFileTypes = {
                'pdf': 'Document files',
                'doc': 'Word documents', 
                'docx': 'Word documents',
                'xls': 'Spreadsheets',
                'xlsx': 'Spreadsheets',
                'csv': 'Data exports',
                'txt': 'Text files',
                'zip': 'Compressed files'
            };
            
            const fileTypeAnalysis = {};
            contentDocuments.forEach(doc => {
                const fileType = doc.FileType?.toLowerCase() || 'unknown';
                if (!fileTypeAnalysis[fileType]) fileTypeAnalysis[fileType] = 0;
                fileTypeAnalysis[fileType]++;
            });
            
            Object.entries(fileTypeAnalysis).forEach(([type, count]) => {
                const description = sensitiveFileTypes[type] || 'Other files';
                details.push(`  - ${type.toUpperCase()}: ${count} files (${description})`);
            });
            
            // Check for large files that might contain sensitive data
            const largeFiles = contentDocuments.filter(doc => doc.ContentSize > 5242880); // > 5MB
            if (largeFiles.length > 0) {
                details.push(`📊 Found ${largeFiles.length} large files (>5MB) that may contain sensitive data`);
                
                // Check if large files have proper access controls
                const publicLargeFiles = largeFiles.filter(doc => doc.IsPublic);
                if (publicLargeFiles.length > 0) {
                    score -= 2;
                    details.push(`🚨 CRITICAL: ${publicLargeFiles.length} large files are publicly accessible`);
                    securityRisks.push('Large public files without classification');
                }
            }
            
            // Analyze file naming patterns for potential sensitive data indicators
            const sensitivePatterns = ['ssn', 'social', 'tax', 'salary', 'confidential', 'private', 'personal', 'credit', 'bank'];
            const potentiallySensitiveFiles = contentDocuments.filter(doc => 
                doc.Title && sensitivePatterns.some(pattern => 
                    doc.Title.toLowerCase().includes(pattern)
                )
            );
            
            if (potentiallySensitiveFiles.length > 0) {
                details.push(`🔍 Found ${potentiallySensitiveFiles.length} files with potentially sensitive naming patterns`);
                potentiallySensitiveFiles.slice(0, 3).forEach(doc => {
                    details.push(`  - ${doc.Title} (${doc.FileType}, Created: ${doc.CreatedDate})`);
                });
                
                if (potentiallySensitiveFiles.length > 5) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Multiple files with sensitive naming patterns - ensure proper classification`);
                    securityRisks.push('Unclassified potentially sensitive files');
                }
            }
        }

        // Analyze email messages for data classification needs
        if (emailMessages.length > 0) {
            details.push(`📧 Analyzing ${emailMessages.length} recent email messages`);
            
            // Check for external email addresses (potential data sharing)
            const externalEmails = emailMessages.filter(email => 
                email.ToAddress && !email.ToAddress.includes('@') // Simplified check
            );
            
            if (externalEmails.length > 0) {
                details.push(`🌐 Found ${externalEmails.length} emails with external recipients`);
                if (externalEmails.length > emailMessages.length * 0.3) { // > 30% external
                    score -= 1;
                    details.push(`⚠️ WARNING: High volume of external email communication - ensure data classification policies`);
                    securityRisks.push('High external email volume without classification');
                }
            }
            
            // Check for potentially sensitive email subjects
            const sensitiveEmailPatterns = ['confidential', 'private', 'sensitive', 'restricted', 'internal only'];
            const sensitiveEmails = emailMessages.filter(email => 
                email.Subject && sensitiveEmailPatterns.some(pattern => 
                    email.Subject.toLowerCase().includes(pattern)
                )
            );
            
            if (sensitiveEmails.length > 0) {
                details.push(`🔒 Found ${sensitiveEmails.length} emails with sensitive subject indicators`);
                if (sensitiveEmails.length > 10) {
                    details.push(`📋 Consider implementing email data classification and DLP policies`);
                }
            }
        }

        // Analyze field-level data for classification needs
        if (fieldPermissions.length > 0) {
            // Check for fields that might contain sensitive data
            const sensitiveFieldPatterns = ['ssn', 'social', 'tax', 'salary', 'credit', 'bank', 'phone', 'email', 'address'];
            const potentiallySensitiveFields = fieldPermissions.filter(fp => 
                sensitiveFieldPatterns.some(pattern => 
                    fp.Field.toLowerCase().includes(pattern)
                )
            );
            
            if (potentiallySensitiveFields.length > 0) {
                details.push(`🔍 Found ${potentiallySensitiveFields.length} fields with potentially sensitive data patterns`);
                
                // Group by object type
                const fieldsByObject = {};
                potentiallySensitiveFields.forEach(fp => {
                    if (!fieldsByObject[fp.SobjectType]) fieldsByObject[fp.SobjectType] = [];
                    fieldsByObject[fp.SobjectType].push(fp.Field);
                });
                
                Object.entries(fieldsByObject).forEach(([objType, fields]) => {
                    details.push(`  - ${objType}: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? ` (+${fields.length - 3} more)` : ''}`);
                });
                
                if (potentiallySensitiveFields.length > 20) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Many potentially sensitive fields - implement data classification framework`);
                    securityRisks.push('Many unclassified sensitive fields');
                }
            }
        }

        // Check for data classification framework implementation
        const hasDataClassificationFramework = false; // This would be determined by checking for specific custom metadata types, fields, etc.
        
        if (!hasDataClassificationFramework) {
            score -= 2;
            details.push(`🚨 MISSING: No comprehensive data classification framework detected`);
            securityRisks.push('No data classification framework');
        }

        // Generate recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('No data classification framework')) {
                details.push(`  • Implement a comprehensive data classification framework`);
                details.push(`  • Create custom metadata types for data sensitivity levels`);
                details.push(`  • Establish data handling policies based on classification`);
                details.push(`  • Train users on data classification requirements`);
            }
            if (securityRisks.includes('Large public files without classification')) {
                details.push(`  • Review and classify all public files for sensitive data`);
                details.push(`  • Implement file access controls based on data sensitivity`);
                details.push(`  • Set up monitoring for public file access`);
            }
            if (securityRisks.includes('Unclassified potentially sensitive files')) {
                details.push(`  • Review files with sensitive naming patterns`);
                details.push(`  • Implement automated data discovery and classification`);
                details.push(`  • Create policies for sensitive file handling`);
            }
            if (securityRisks.includes('Many unclassified sensitive fields')) {
                details.push(`  • Implement field-level data classification`);
                details.push(`  • Review and enhance field-level security settings`);
                details.push(`  • Create data governance policies for sensitive fields`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    evaluateAuditTrailsAndMonitoring() {
        const loginHistory = this.orgData.queryData.loginHistory || [];
        const setupAuditTrail = this.orgData.queryData.setupAuditTrail || [];
        const apiUsage = this.orgData.queryData.apiUsage || [];
        const dataExport = this.orgData.queryData.dataExport || [];

        let score = 10;
        let details = [];
        let securityRisks = [];

        // Analyze login patterns for suspicious activity
        if (loginHistory.length > 0) {
            details.push(`📊 Analyzing ${loginHistory.length} login records`);
            
            // Check for failed login attempts
            const failedLogins = loginHistory.filter(login => login.Status === 'Failed');
            if (failedLogins.length > 0) {
                const failureRate = (failedLogins.length / loginHistory.length) * 100;
                details.push(`⚠️ Found ${failedLogins.length} failed login attempts (${failureRate.toFixed(1)}% failure rate)`);
                
                if (failureRate > 10) {
                    score -= 2;
                    details.push(`🚨 HIGH RISK: Login failure rate exceeds 10% - potential brute force attacks`);
                    securityRisks.push('High login failure rate detected');
                }
            }

            // Check for unusual login locations/IPs
            const ipAddresses = [...new Set(loginHistory.map(login => login.SourceIp).filter(ip => ip))];
            if (ipAddresses.length > 0) {
                details.push(`🌐 Logins from ${ipAddresses.length} unique IP addresses`);
                
                // Check for logins from many different IPs (potential account compromise)
                if (ipAddresses.length > 50) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Logins from ${ipAddresses.length} different IP addresses - review for legitimacy`);
                    securityRisks.push('Logins from many IP addresses');
                }
            }

            // Check for unusual login times (outside business hours)
            const businessHourLogins = loginHistory.filter(login => {
                const loginTime = new Date(login.LoginTime);
                const hour = loginTime.getHours();
                return hour >= 8 && hour <= 18; // 8 AM to 6 PM
            });
            const afterHoursLogins = loginHistory.length - businessHourLogins.length;
            
            if (afterHoursLogins > 0) {
                const afterHoursRate = (afterHoursLogins / loginHistory.length) * 100;
                details.push(`🌙 ${afterHoursLogins} logins outside business hours (${afterHoursRate.toFixed(1)}%)`);
                
                if (afterHoursRate > 30) {
                    details.push(`📋 Consider reviewing after-hours access patterns for security`);
                }
            }
        } else {
            details.push('⚠️ No login history data available - ensure login monitoring is enabled');
            score -= 2;
        }

        // Analyze setup audit trail for unauthorized changes
        if (setupAuditTrail.length > 0) {
            details.push(`🔧 Analyzing ${setupAuditTrail.length} setup changes`);
            
            // Check for critical setup changes
            const criticalActions = setupAuditTrail.filter(audit => 
                audit.Action && (
                    audit.Action.includes('Profile') ||
                    audit.Action.includes('Permission') ||
                    audit.Action.includes('User') ||
                    audit.Action.includes('Security') ||
                    audit.Action.includes('Connected')
                )
            );
            
            if (criticalActions.length > 0) {
                details.push(`🚨 Found ${criticalActions.length} critical security-related setup changes`);
                
                // Group by user to identify who's making changes
                const changesByUser = {};
                criticalActions.forEach(audit => {
                    const user = audit.CreatedBy?.Name || 'Unknown';
                    if (!changesByUser[user]) changesByUser[user] = 0;
                    changesByUser[user]++;
                });
                
                Object.entries(changesByUser).forEach(([user, count]) => {
                    details.push(`  - ${user}: ${count} security changes`);
                });
                
                // Check for changes by non-admin users
                const recentCriticalChanges = criticalActions.filter(audit => {
                    const changeDate = new Date(audit.CreatedDate);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return changeDate > thirtyDaysAgo;
                });
                
                if (recentCriticalChanges.length > 10) {
                    score -= 1;
                    details.push(`⚠️ WARNING: ${recentCriticalChanges.length} critical security changes in last 30 days`);
                    securityRisks.push('High volume of recent security changes');
                }
            }
        } else {
            details.push('⚠️ No setup audit trail data available - ensure audit trail is enabled');
            score -= 1;
        }

        // Analyze API usage for suspicious patterns
        if (apiUsage.length > 0) {
            details.push(`🔌 Analyzing ${apiUsage.length} API requests`);
            
            // Check for high-volume API usage (potential data extraction)
            const apiCallsByUrl = {};
            apiUsage.forEach(api => {
                const url = api.Url || 'Unknown';
                if (!apiCallsByUrl[url]) apiCallsByUrl[url] = 0;
                apiCallsByUrl[url]++;
            });
            
            const highVolumeApis = Object.entries(apiCallsByUrl).filter(([url, count]) => count > 100);
            if (highVolumeApis.length > 0) {
                details.push(`📈 Found ${highVolumeApis.length} high-volume API endpoints (>100 calls)`);
                highVolumeApis.slice(0, 3).forEach(([url, count]) => {
                    details.push(`  - ${url}: ${count} calls`);
                });
                
                if (highVolumeApis.some(([url, count]) => count > 1000)) {
                    score -= 1;
                    details.push(`⚠️ WARNING: Some API endpoints have >1000 calls - monitor for data exfiltration`);
                    securityRisks.push('High-volume API usage detected');
                }
            }

            // Check for API errors that might indicate attacks
            const apiErrors = apiUsage.filter(api => api.Status && api.Status >= 400);
            if (apiErrors.length > 0) {
                const errorRate = (apiErrors.length / apiUsage.length) * 100;
                details.push(`❌ ${apiErrors.length} API errors (${errorRate.toFixed(1)}% error rate)`);
                
                if (errorRate > 20) {
                    score -= 1;
                    details.push(`⚠️ WARNING: High API error rate may indicate attack attempts`);
                    securityRisks.push('High API error rate');
                }
            }
        }

        // Analyze data export activities
        if (dataExport.length > 0) {
            details.push(`📤 Found ${dataExport.length} data export activities`);
            
            // Check for recent large data exports
            const recentExports = dataExport.filter(exp => {
                const exportDate = new Date(exp.ExportedDate);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return exportDate > thirtyDaysAgo;
            });
            
            if (recentExports.length > 0) {
                details.push(`📋 ${recentExports.length} data exports in last 30 days`);
                recentExports.forEach(exp => {
                    details.push(`  - ${exp.Type || 'Unknown'} by ${exp.ExportedBy?.Name || 'Unknown'} (${exp.ExportedDate})`);
                });
                
                if (recentExports.length > 5) {
                    score -= 1;
                    details.push(`⚠️ WARNING: High volume of recent data exports - review for legitimacy`);
                    securityRisks.push('High volume of data exports');
                }
            }
        }

        // Generate recommendations
        if (securityRisks.length > 0) {
            details.push(`🛡️ SECURITY RECOMMENDATIONS:`);
            if (securityRisks.includes('High login failure rate detected')) {
                details.push(`  • Implement account lockout policies after failed attempts`);
                details.push(`  • Enable IP restrictions for sensitive profiles`);
                details.push(`  • Set up login anomaly alerts`);
            }
            if (securityRisks.includes('High volume of recent security changes')) {
                details.push(`  • Review all recent security configuration changes`);
                details.push(`  • Implement change approval processes for security settings`);
                details.push(`  • Set up alerts for critical security changes`);
            }
            if (securityRisks.includes('High-volume API usage detected')) {
                details.push(`  • Monitor API usage patterns for anomalies`);
                details.push(`  • Implement API rate limiting where appropriate`);
                details.push(`  • Review high-volume API consumers for legitimacy`);
            }
            if (securityRisks.includes('High volume of data exports')) {
                details.push(`  • Implement data export approval workflows`);
                details.push(`  • Monitor and alert on large data exports`);
                details.push(`  • Review data export permissions and necessity`);
            }
        }

        score = Math.max(0, score);
        return { score, details };
    }

    /**
     * Calculate weighted section scores (now security categories)
     */
    calculateSectionScore(categoryResults, categoryConfig) {
        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(categoryResults).forEach(([key, result]) => {
            if (key !== 'overallScore' && result.score) {
                const weight = categoryConfig[key]?.weight || 0;
                totalScore += result.score * weight;
                totalWeight += weight;
            }
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    /**
     * Calculate overall audit score using security category weights
     */
    calculateOverallScore() {
        let overallSecurityScore = 0;
        let totalWeight = 0;

        for (const categoryKey in this.auditResults.securityCategories) {
            if (Object.hasOwnProperty.call(this.auditResults.securityCategories, categoryKey)) {
                const categoryResult = this.auditResults.securityCategories[categoryKey];
                const categoryConfig = this.config.securityCategories[categoryKey];
                if (categoryResult.score !== undefined && categoryConfig.weight !== undefined) {
                    overallSecurityScore += categoryResult.score * categoryConfig.weight;
                    totalWeight += categoryConfig.weight;
                }
            }
        }
        
        this.auditResults.overallScore = totalWeight > 0 ? overallSecurityScore / totalWeight : 0;
        
        // Generate score analysis
        this.auditResults.scoreAnalysis = this.generateScoreAnalysis();
        
        console.log(`📊 Overall Security Assessment Score: ${this.auditResults.overallScore.toFixed(2)}/10`);
    }

    /**
     * Generate analysis of the overall score including top reasons for the score
     * and why it wasn't higher
     */
    generateScoreAnalysis() {
        const categories = [];
        
        // Collect all categories with their weighted contributions
        for (const categoryKey in this.auditResults.securityCategories) {
            if (Object.hasOwnProperty.call(this.auditResults.securityCategories, categoryKey)) {
                const categoryResult = this.auditResults.securityCategories[categoryKey];
                const categoryConfig = this.config.securityCategories[categoryKey];
                
                categories.push({
                    key: categoryKey,
                    name: categoryConfig.name,
                    score: categoryResult.score,
                    weight: categoryConfig.weight,
                    weightedScore: categoryResult.score * categoryConfig.weight,
                    details: categoryResult.details
                });
            }
        }
        
        // Sort by weighted score contribution (highest first)
        categories.sort((a, b) => b.weightedScore - a.weightedScore);
        
        // Get top 3 contributing categories (positive factors)
        const topContributors = categories.slice(0, 3);
        
        // Sort by score to find lowest performing categories (areas for improvement)
        const categoriesByScore = [...categories].sort((a, b) => a.score - b.score);
        const lowestPerforming = categoriesByScore.slice(0, 3);
        
        return {
            topReasons: topContributors.map(cat => ({
                category: cat.name,
                score: cat.score,
                weight: cat.weight,
                contribution: cat.weightedScore,
                reason: `${cat.name} scored ${cat.score.toFixed(1)}/10 (${(cat.weight * 100).toFixed(0)}% weight)`
            })),
            improvementAreas: lowestPerforming.map(cat => ({
                category: cat.name,
                score: cat.score,
                weight: cat.weight,
                potentialGain: (10 - cat.score) * cat.weight,
                reason: `${cat.name} scored only ${cat.score.toFixed(1)}/10 - improving this could add ${((10 - cat.score) * cat.weight).toFixed(1)} points`
            }))
        };
    }

    /**
     * Generate prioritized security recommendations
     */
    generateRecommendations() {
        console.log('💡 Generating security recommendations...');
        
        const recommendations = {
            critical: [], // Score < 2
            high: [],     // Score 2-5
            medium: [],   // Score 5-7
            low: []       // Score 7+
        };

        // Analyze scores and categorize recommendations based on security thresholds
        for (const categoryKey in this.auditResults.securityCategories) {
            if (Object.hasOwnProperty.call(this.auditResults.securityCategories, categoryKey)) {
                const categoryResult = this.auditResults.securityCategories[categoryKey];
                const categoryConfig = this.config.securityCategories[categoryKey];
                const score = categoryResult.score;
                const categoryName = categoryConfig.name;

                let priority = 'low';
                let recommendationText = '';

                if (score < 2) {
                    priority = 'critical';
                    recommendationText = `CRITICAL: ${categoryName} requires immediate attention. Score: ${score}/10`;
                } else if (score < 5) {
                    priority = 'high';
                    recommendationText = `HIGH: ${categoryName} has significant security gaps. Score: ${score}/10`;
                } else if (score < 7) {
                    priority = 'medium';
                    recommendationText = `MEDIUM: ${categoryName} needs improvement. Score: ${score}/10`;
                } else {
                    priority = 'low';
                    recommendationText = `LOW: ${categoryName} is performing well but can be optimized. Score: ${score}/10`;
                }

                recommendations[priority].push({
                    category: categoryName,
                    score: score,
                    details: categoryResult.details,
                    recommendation: recommendationText
                });
            }
        }
        
        this.auditResults.recommendations = recommendations;
    }

    /**
     * Generate comprehensive reports
     */
    async generateReports() {
        console.log('📄 Generating audit reports...');
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        
        // Generate HTML report with charts
        const htmlReport = this.generateHTMLReport();
        
        // Generate action plan
        const actionPlan = this.generateActionPlan();
        
        return {
            markdown: markdownReport,
            html: htmlReport,
            actionPlan: actionPlan
        };
    }

    /**
     * Generate security markdown report
     */
    generateMarkdownReport() {
        const timestamp = new Date().toISOString();
        
        let report = `# Salesforce Security Assessment Report

**Generated:** ${timestamp}  
**Organization:** ${this.orgAlias || 'Unknown'}  
**Overall Security Score:** ${this.auditResults.overallScore.toFixed(2)}/10

## Executive Summary

This security assessment evaluates your Salesforce organization across 7 critical security categories. The overall score reflects the weighted average of all security categories based on their relative importance.

## Security Category Scores

`;

        // Add individual category scores
        for (const categoryKey in this.auditResults.securityCategories) {
            if (Object.hasOwnProperty.call(this.auditResults.securityCategories, categoryKey)) {
                const categoryResult = this.auditResults.securityCategories[categoryKey];
                const categoryConfig = this.config.securityCategories[categoryKey];
                const score = categoryResult.score;
                const weight = (categoryConfig.weight * 100).toFixed(0);
                
                report += `### ${categoryConfig.name} (${weight}% weight)
**Score:** ${score.toFixed(2)}/10

**Details:**
${categoryResult.details.map(detail => `- ${detail}`).join('\n')}

`;
            }
        }

        report += `## Security Recommendations

${this.formatRecommendations()}

## Action Plan

${this.formatActionPlan()}

## Compliance Summary

This assessment helps identify areas for improvement to maintain security best practices and regulatory compliance. Regular security assessments are recommended to ensure ongoing protection of your Salesforce data and systems.

---
*Report generated by Salesforce Security Assessment Tool*  
*Provided by Jon Cline who leads People First CRM and DevPod for Salesforce Partners.*
`;

        return report;
    }

    /**
     * Generate HTML report with visual elements
     */
    generateHTMLReport() {
        const timestamp = new Date().toISOString();
        const overallScore = this.auditResults.overallScore.toFixed(2);
        
        // Generate category scores for chart
        const categoryScores = [];
        const categoryLabels = [];
        for (const categoryKey in this.auditResults.securityCategories) {
            if (Object.hasOwnProperty.call(this.auditResults.securityCategories, categoryKey)) {
                const categoryResult = this.auditResults.securityCategories[categoryKey];
                const categoryConfig = this.config.securityCategories[categoryKey];
                categoryLabels.push(categoryConfig.name);
                categoryScores.push(categoryResult.score.toFixed(2));
            }
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salesforce Security Assessment Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #0176d3;
        }
        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5em;
            font-weight: bold;
            color: white;
            background: linear-gradient(45deg, #0176d3, #00a1e0);
        }
        .chart-container {
            width: 100%;
            height: 400px;
            margin: 30px 0;
        }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .category-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0176d3;
        }
        .category-score {
            font-size: 1.5em;
            font-weight: bold;
            color: #0176d3;
        }
        .recommendations {
            margin-top: 40px;
        }
        .priority-critical { border-left-color: #d63031; }
        .priority-high { border-left-color: #e17055; }
        .priority-medium { border-left-color: #fdcb6e; }
        .priority-low { border-left-color: #00b894; }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Salesforce Security Assessment Report</h1>
            <div class="score-circle">${overallScore}/10</div>
            <h2>Overall Security Score</h2>
        </div>

        <div class="metadata">
            <strong>Generated:</strong> ${timestamp}<br>
            <strong>Organization:</strong> ${this.orgAlias || 'Unknown'}<br>
            <strong>Assessment Type:</strong> Comprehensive Security Evaluation
        </div>

        <div class="chart-container">
            <canvas id="securityChart"></canvas>
        </div>

        <div class="category-grid">
            ${categoryLabels.map((label, index) => `
                <div class="category-card">
                    <h3>${label}</h3>
                    <div class="category-score">${categoryScores[index]}/10</div>
                    <p>Weight: ${(this.config.securityCategories[Object.keys(this.config.securityCategories)[index]].weight * 100).toFixed(0)}%</p>
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>🎯 Security Recommendations</h2>
            ${this.generateHTMLRecommendations()}
        </div>

        <div class="action-plan">
            <h2>📋 Action Plan</h2>
            ${this.generateHTMLActionPlan()}
        </div>

        <footer style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
            <p>Report generated by Salesforce Security Assessment Tool</p>
            <p>Provided by Jon Cline who leads People First CRM and DevPod for Salesforce Partners.</p>
        </footer>
    </div>

    <script>
        // Create radar chart for security categories
        const ctx = document.getElementById('securityChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ${JSON.stringify(categoryLabels)},
                datasets: [{
                    label: 'Security Scores',
                    data: ${JSON.stringify(categoryScores)},
                    backgroundColor: 'rgba(1, 118, 211, 0.2)',
                    borderColor: 'rgba(1, 118, 211, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(1, 118, 211, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(1, 118, 211, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Security Category Scores'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate HTML formatted recommendations
     */
    generateHTMLRecommendations() {
        const recommendations = this.auditResults.recommendations;
        let html = '';

        const priorities = [
            { key: 'critical', label: '🚨 Critical Priority', class: 'priority-critical' },
            { key: 'high', label: '⚠️ High Priority', class: 'priority-high' },
            { key: 'medium', label: '⚡ Medium Priority', class: 'priority-medium' },
            { key: 'low', label: '✅ Low Priority', class: 'priority-low' }
        ];

        priorities.forEach(priority => {
            if (recommendations[priority.key].length > 0) {
                html += `<h3>${priority.label}</h3>`;
                recommendations[priority.key].forEach(rec => {
                    html += `
                        <div class="category-card ${priority.class}">
                            <h4>${rec.category} (Score: ${rec.score.toFixed(2)}/10)</h4>
                            <p><strong>${rec.recommendation}</strong></p>
                            <ul>
                                ${rec.details.map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                });
            }
        });

        return html || '<p>No specific recommendations at this time.</p>';
    }

    /**
     * Generate HTML formatted action plan
     */
    generateHTMLActionPlan() {
        const actionPlan = this.auditResults.actionPlan;
        let html = '';

        const timelines = [
            { key: 'immediate', label: '🔥 Immediate Actions (1-30 days)', class: 'priority-critical' },
            { key: 'shortTerm', label: '📅 Short-term Actions (1-3 months)', class: 'priority-high' },
            { key: 'mediumTerm', label: '🎯 Medium-term Actions (3-6 months)', class: 'priority-medium' },
            { key: 'longTerm', label: '🔮 Long-term Actions (6+ months)', class: 'priority-low' }
        ];

        timelines.forEach(timeline => {
            if (actionPlan[timeline.key] && actionPlan[timeline.key].length > 0) {
                html += `<h3>${timeline.label}</h3>`;
                actionPlan[timeline.key].forEach(action => {
                    html += `
                        <div class="category-card ${timeline.class}">
                            <h4>${action.priority}: ${action.action}</h4>
                            <p><strong>Category:</strong> ${action.category}</p>
                            <p><strong>Timeline:</strong> ${action.timeline}</p>
                            <p><strong>Effort:</strong> ${action.effort}</p>
                        </div>
                    `;
                });
            }
        });

        return html || '<p>No specific action items at this time.</p>';
    }

    /**
     * Generate security action plan
     */
    generateActionPlan() {
        const actionPlan = {
            immediate: [], // Next 30 days
            shortTerm: [], // Next 90 days
            mediumTerm: [], // Next 6 months
            longTerm: []   // Next 12+ months
        };

        // Categorize recommendations into action plan based on priority
        const recommendations = this.auditResults.recommendations;

        // Critical items go to immediate
        recommendations.critical.forEach(rec => {
            actionPlan.immediate.push({
                priority: 'Critical',
                category: rec.category,
                action: `Address ${rec.category} security issues immediately`,
                timeline: '1-7 days',
                effort: 'High'
            });
        });

        // High priority items go to immediate/short-term
        recommendations.high.forEach(rec => {
            actionPlan.shortTerm.push({
                priority: 'High',
                category: rec.category,
                action: `Implement security improvements for ${rec.category}`,
                timeline: '1-4 weeks',
                effort: 'Medium-High'
            });
        });

        // Medium priority items go to medium-term
        recommendations.medium.forEach(rec => {
            actionPlan.mediumTerm.push({
                priority: 'Medium',
                category: rec.category,
                action: `Optimize ${rec.category} security configuration`,
                timeline: '1-3 months',
                effort: 'Medium'
            });
        });

        // Low priority items go to long-term
        recommendations.low.forEach(rec => {
            actionPlan.longTerm.push({
                priority: 'Low',
                category: rec.category,
                action: `Fine-tune ${rec.category} for enhanced security`,
                timeline: '3-6 months',
                effort: 'Low-Medium'
            });
        });

        this.auditResults.actionPlan = actionPlan;
        return actionPlan;
    }

    /**
     * Format recommendations for output
     */
    formatRecommendations() {
        const recommendations = this.auditResults.recommendations;
        let formatted = '';

        if (recommendations.critical.length > 0) {
            formatted += '### 🚨 Critical Priority\n\n';
            recommendations.critical.forEach(rec => {
                formatted += `**${rec.category}** (Score: ${rec.score.toFixed(2)}/10)\n`;
                formatted += `${rec.recommendation}\n\n`;
                formatted += 'Details:\n';
                rec.details.forEach(detail => {
                    formatted += `- ${detail}\n`;
                });
                formatted += '\n';
            });
        }

        if (recommendations.high.length > 0) {
            formatted += '### ⚠️ High Priority\n\n';
            recommendations.high.forEach(rec => {
                formatted += `**${rec.category}** (Score: ${rec.score.toFixed(2)}/10)\n`;
                formatted += `${rec.recommendation}\n\n`;
                formatted += 'Details:\n';
                rec.details.forEach(detail => {
                    formatted += `- ${detail}\n`;
                });
                formatted += '\n';
            });
        }

        if (recommendations.medium.length > 0) {
            formatted += '### ⚡ Medium Priority\n\n';
            recommendations.medium.forEach(rec => {
                formatted += `**${rec.category}** (Score: ${rec.score.toFixed(2)}/10)\n`;
                formatted += `${rec.recommendation}\n\n`;
                formatted += 'Details:\n';
                rec.details.forEach(detail => {
                    formatted += `- ${detail}\n`;
                });
                formatted += '\n';
            });
        }

        if (recommendations.low.length > 0) {
            formatted += '### ✅ Low Priority\n\n';
            recommendations.low.forEach(rec => {
                formatted += `**${rec.category}** (Score: ${rec.score.toFixed(2)}/10)\n`;
                formatted += `${rec.recommendation}\n\n`;
                formatted += 'Details:\n';
                rec.details.forEach(detail => {
                    formatted += `- ${detail}\n`;
                });
                formatted += '\n';
            });
        }

        return formatted || 'No specific recommendations at this time.';
    }

    /**
     * Format action plan for output
     */
    formatActionPlan() {
        const actionPlan = this.auditResults.actionPlan;
        let formatted = '';

        if (actionPlan.immediate && actionPlan.immediate.length > 0) {
            formatted += '### 🔥 Immediate Actions (1-30 days)\n\n';
            actionPlan.immediate.forEach(action => {
                formatted += `**${action.priority}:** ${action.action}\n`;
                formatted += `- **Category:** ${action.category}\n`;
                formatted += `- **Timeline:** ${action.timeline}\n`;
                formatted += `- **Effort:** ${action.effort}\n\n`;
            });
        }

        if (actionPlan.shortTerm && actionPlan.shortTerm.length > 0) {
            formatted += '### 📅 Short-term Actions (1-3 months)\n\n';
            actionPlan.shortTerm.forEach(action => {
                formatted += `**${action.priority}:** ${action.action}\n`;
                formatted += `- **Category:** ${action.category}\n`;
                formatted += `- **Timeline:** ${action.timeline}\n`;
                formatted += `- **Effort:** ${action.effort}\n\n`;
            });
        }

        if (actionPlan.mediumTerm && actionPlan.mediumTerm.length > 0) {
            formatted += '### 🎯 Medium-term Actions (3-6 months)\n\n';
            actionPlan.mediumTerm.forEach(action => {
                formatted += `**${action.priority}:** ${action.action}\n`;
                formatted += `- **Category:** ${action.category}\n`;
                formatted += `- **Timeline:** ${action.timeline}\n`;
                formatted += `- **Effort:** ${action.effort}\n\n`;
            });
        }

        if (actionPlan.longTerm && actionPlan.longTerm.length > 0) {
            formatted += '### 🔮 Long-term Actions (6+ months)\n\n';
            actionPlan.longTerm.forEach(action => {
                formatted += `**${action.priority}:** ${action.action}\n`;
                formatted += `- **Category:** ${action.category}\n`;
                formatted += `- **Timeline:** ${action.timeline}\n`;
                formatted += `- **Effort:** ${action.effort}\n\n`;
            });
        }

        return formatted || 'No specific action items at this time.';
    }
}

// Export the audit framework
module.exports = SalesforceWellArchitectedAudit;

// Example usage
if (require.main === module) {
    const audit = new SalesforceWellArchitectedAudit();
    
    console.log('🏗️ Salesforce Well-Architected Framework - Cline Edition');
    console.log('📋 Framework initialized with 35-point evaluation system');
    console.log('⚖️ Pillar weights: Trusted (35%), Easy (30%), Adaptable (35%)');
    console.log('\n🚀 Ready to execute comprehensive Salesforce audits within VS Code!');
    
    // Example audit execution (commented out for now)
    // audit.executeAudit('https://your-org.sandbox.lightning.force.com/')
    //     .then(results => console.log('Audit completed:', results))
    //     .catch(error => console.error('Audit failed:', error));
}
