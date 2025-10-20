/**
 * 🚀 RELEASE TRACKING SYSTEM
 * Tracks releases with commit SHA, deploy ID, and environment
 *
 * Purpose:
 * - Correlate releases with Azure Application Insights telemetry
 * - Track deployment success/failure
 * - Monitor post-deployment metrics
 * - Enable rollback tracking
 *
 * Features:
 * - Git commit SHA extraction
 * - Deployment ID generation
 * - Release annotation in Azure Insights
 * - Deployment history tracking
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Azure Application Insights client
let appInsights;
try {
    appInsights = require('applicationinsights');
} catch (error) {
    console.warn('⚠️ Application Insights not installed - release tracking will be limited');
}

/**
 * Get current Git commit SHA
 * @returns {string} - Commit SHA (short form)
 */
function getCommitSHA() {
    try {
        const sha = execSync('git rev-parse --short HEAD', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return sha;
    } catch (error) {
        console.warn('⚠️ Failed to get Git commit SHA:', error.message);
        return 'unknown';
    }
}

/**
 * Get current Git branch name
 * @returns {string} - Branch name
 */
function getBranchName() {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return branch;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Get Git commit message
 * @returns {string} - Commit message
 */
function getCommitMessage() {
    try {
        const message = execSync('git log -1 --pretty=%B', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return message;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Get Git commit author
 * @returns {string} - Author name
 */
function getCommitAuthor() {
    try {
        const author = execSync('git log -1 --pretty=%an', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return author;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Get Git commit timestamp
 * @returns {string} - Commit timestamp (ISO)
 */
function getCommitTimestamp() {
    try {
        const timestamp = execSync('git log -1 --pretty=%aI', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return timestamp;
    } catch (error) {
        return new Date().toISOString();
    }
}

/**
 * Generate unique deployment ID
 * @returns {string} - Deployment ID
 */
function generateDeploymentID() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `deploy_${timestamp}_${random}`;
}

/**
 * Get current environment
 * @returns {string} - Environment name
 */
function getEnvironment() {
    return process.env.NODE_ENV || 'development';
}

/**
 * Get deployment platform
 * @returns {string} - Platform name
 */
function getDeploymentPlatform() {
    if (process.env.VERCEL) return 'vercel';
    if (process.env.RAILWAY_ENVIRONMENT) return 'railway';
    if (process.env.RENDER) return 'render';
    if (process.env.HEROKU_APP_NAME) return 'heroku';
    if (process.env.AWS_REGION) return 'aws';
    if (process.env.AZURE_FUNCTIONS_ENVIRONMENT) return 'azure';
    return 'local';
}

/**
 * Create release information object
 * @returns {object} - Release metadata
 */
function createReleaseInfo() {
    const deploymentID = generateDeploymentID();
    const commitSHA = getCommitSHA();
    const branch = getBranchName();
    const commitMessage = getCommitMessage();
    const commitAuthor = getCommitAuthor();
    const commitTimestamp = getCommitTimestamp();
    const environment = getEnvironment();
    const platform = getDeploymentPlatform();
    const deployTimestamp = new Date().toISOString();

    const releaseInfo = {
        deploymentID,
        commitSHA,
        branch,
        commitMessage,
        commitAuthor,
        commitTimestamp,
        environment,
        platform,
        deployTimestamp,
        nodeVersion: process.version,
        platform_arch: process.platform,
        arch: process.arch
    };

    return releaseInfo;
}

/**
 * Save release info to file system
 * @param {object} releaseInfo - Release metadata
 */
function saveReleaseInfo(releaseInfo) {
    const releaseDir = path.join(process.cwd(), '.releases');

    // Create .releases directory if it doesn't exist
    if (!fs.existsSync(releaseDir)) {
        fs.mkdirSync(releaseDir, { recursive: true });
    }

    // Save release info
    const releaseFile = path.join(releaseDir, `${releaseInfo.deploymentID}.json`);
    fs.writeFileSync(releaseFile, JSON.stringify(releaseInfo, null, 2));

    // Update current release pointer
    const currentReleaseFile = path.join(releaseDir, 'current.json');
    fs.writeFileSync(currentReleaseFile, JSON.stringify(releaseInfo, null, 2));

    console.log(`✅ Release info saved: ${releaseFile}`);
}

/**
 * Get current release info
 * @returns {object|null} - Current release metadata
 */
function getCurrentReleaseInfo() {
    const currentReleaseFile = path.join(process.cwd(), '.releases', 'current.json');

    if (fs.existsSync(currentReleaseFile)) {
        try {
            const data = fs.readFileSync(currentReleaseFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn('⚠️ Failed to read current release info:', error.message);
            return null;
        }
    }

    return null;
}

/**
 * Track release in Azure Application Insights
 * @param {object} releaseInfo - Release metadata
 */
function trackReleaseInAzure(releaseInfo) {
    if (!appInsights || !appInsights.defaultClient) {
        console.warn('⚠️ Azure Application Insights not configured - skipping release tracking');
        return;
    }

    try {
        // Create release annotation
        appInsights.defaultClient.trackEvent({
            name: 'Release Deployed',
            properties: {
                deploymentID: releaseInfo.deploymentID,
                commitSHA: releaseInfo.commitSHA,
                branch: releaseInfo.branch,
                commitMessage: releaseInfo.commitMessage,
                commitAuthor: releaseInfo.commitAuthor,
                environment: releaseInfo.environment,
                platform: releaseInfo.platform,
                deployTimestamp: releaseInfo.deployTimestamp
            }
        });

        // Set cloud role instance to deployment ID
        appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRoleInstance] = releaseInfo.deploymentID;

        // Set application version to commit SHA
        appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.applicationVersion] = releaseInfo.commitSHA;

        console.log('✅ Release tracked in Azure Application Insights');
    } catch (error) {
        console.error('❌ Failed to track release in Azure:', error.message);
    }
}

/**
 * Initialize release tracking on server startup
 */
function initializeReleaseTracking() {
    console.log('🚀 Initializing release tracking...');

    const releaseInfo = createReleaseInfo();
    saveReleaseInfo(releaseInfo);
    trackReleaseInAzure(releaseInfo);

    console.log('✅ Release tracking initialized');
    console.log('📋 Release Info:');
    console.log(`   Deployment ID: ${releaseInfo.deploymentID}`);
    console.log(`   Commit SHA: ${releaseInfo.commitSHA}`);
    console.log(`   Branch: ${releaseInfo.branch}`);
    console.log(`   Environment: ${releaseInfo.environment}`);
    console.log(`   Platform: ${releaseInfo.platform}`);
    console.log(`   Deploy Time: ${releaseInfo.deployTimestamp}`);

    return releaseInfo;
}

/**
 * Get release history
 * @param {number} limit - Number of releases to return
 * @returns {array} - Array of release objects
 */
function getReleaseHistory(limit = 10) {
    const releaseDir = path.join(process.cwd(), '.releases');

    if (!fs.existsSync(releaseDir)) {
        return [];
    }

    try {
        const files = fs.readdirSync(releaseDir)
            .filter(file => file.endsWith('.json') && file !== 'current.json')
            .sort((a, b) => {
                const statA = fs.statSync(path.join(releaseDir, a));
                const statB = fs.statSync(path.join(releaseDir, b));
                return statB.mtime - statA.mtime; // Newest first
            })
            .slice(0, limit);

        const releases = files.map(file => {
            const data = fs.readFileSync(path.join(releaseDir, file), 'utf8');
            return JSON.parse(data);
        });

        return releases;
    } catch (error) {
        console.error('❌ Failed to read release history:', error.message);
        return [];
    }
}

/**
 * Express middleware to add release info to requests
 */
function releaseTrackingMiddleware(req, res, next) {
    const releaseInfo = getCurrentReleaseInfo();

    if (releaseInfo) {
        req.release = releaseInfo;
        res.setHeader('X-Release-ID', releaseInfo.deploymentID);
        res.setHeader('X-Commit-SHA', releaseInfo.commitSHA);
        res.setHeader('X-Environment', releaseInfo.environment);
    }

    next();
}

/**
 * API endpoint to get current release info
 */
function getCurrentReleaseEndpoint(req, res) {
    const releaseInfo = getCurrentReleaseInfo();

    if (releaseInfo) {
        res.json({
            success: true,
            release: releaseInfo
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'No release information found'
        });
    }
}

/**
 * API endpoint to get release history
 */
function getReleaseHistoryEndpoint(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const releases = getReleaseHistory(limit);

    res.json({
        success: true,
        releases,
        count: releases.length
    });
}

/**
 * Create release annotation script for Azure
 * @param {object} releaseInfo - Release metadata
 * @returns {string} - PowerShell script content
 */
function createAzureReleaseAnnotationScript(releaseInfo) {
    return `
# Azure Application Insights Release Annotation Script
# Run this script after deployment to create a release annotation

$appInsightsId = "$AZURE_INSIGHTS_APP_ID"
$appInsightsKey = "$AZURE_INSIGHTS_API_KEY"

$releaseName = "${releaseInfo.commitSHA}"
$releaseProperties = @{
    "DeploymentID" = "${releaseInfo.deploymentID}"
    "CommitSHA" = "${releaseInfo.commitSHA}"
    "Branch" = "${releaseInfo.branch}"
    "Environment" = "${releaseInfo.environment}"
    "Platform" = "${releaseInfo.platform}"
}

$body = @{
    "Id" = [Guid]::NewGuid().ToString()
    "AnnotationName" = $releaseName
    "EventTime" = "${releaseInfo.deployTimestamp}"
    "Category" = "Deployment"
    "Properties" = ConvertTo-Json $releaseProperties
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://aadapiappinsights.azurewebsites.net/api/annotations" \`
    -Method POST \`
    -Headers @{
        "X-AIAPIKEY" = $appInsightsKey
    } \`
    -Body $body \`
    -ContentType "application/json"

Write-Host "✅ Release annotation created successfully"
`;
}

module.exports = {
    getCommitSHA,
    getBranchName,
    getCommitMessage,
    getCommitAuthor,
    getCommitTimestamp,
    generateDeploymentID,
    getEnvironment,
    getDeploymentPlatform,
    createReleaseInfo,
    saveReleaseInfo,
    getCurrentReleaseInfo,
    trackReleaseInAzure,
    initializeReleaseTracking,
    getReleaseHistory,
    releaseTrackingMiddleware,
    getCurrentReleaseEndpoint,
    getReleaseHistoryEndpoint,
    createAzureReleaseAnnotationScript
};
