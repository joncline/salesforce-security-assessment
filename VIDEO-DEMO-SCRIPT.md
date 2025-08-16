# Video Demonstration Script for Salesforce Security Assessment Tool

## Video Overview
**Duration**: 3-5 minutes  
**Purpose**: Show users how to quickly run a security assessment on their Salesforce org  
**Target Audience**: Salesforce administrators and security professionals

## Pre-Recording Setup

### Prerequisites
1. Have a Salesforce org ready (sandbox/dev org recommended)
2. Ensure Salesforce CLI is installed and authenticated
3. Clone the repository and have it ready
4. Terminal/command prompt open in the project directory
5. Have a text editor open to show generated reports

### Authentication Setup (Do this before recording)
```bash
# Authenticate with your demo org
sf org login web --alias demo-org

# Verify connection
sf org display --target-org demo-org
```

## Video Script

### Scene 1: Introduction (30 seconds)
**Screen**: Show the README.md file in GitHub or your editor

**Narration**: 
"Hi! Today I'll show you how to use the Salesforce Security Assessment Tool to evaluate your organization's security posture. This tool analyzes 7 critical security categories and provides actionable recommendations to improve your Salesforce security."

**Actions**:
- Scroll through the README to show the security categories
- Highlight the key features section

### Scene 2: Quick Start Demo (2-3 minutes)
**Screen**: Terminal/command prompt in the project directory

**Narration**: 
"Let's run a quick security assessment. I've already authenticated with my Salesforce org using the SF CLI. Now I'll run the assessment using Method 1 - the quick assessment approach."

**Actions**:
1. Show the current directory structure:
   ```bash
   ls -la
   ```

2. Run the security assessment:
   ```bash
   node tests/real-org-security-test.js demo-org
   ```

3. **While it's running, explain what's happening**:
   "The tool is now connecting to my Salesforce org and collecting security-relevant data. It's checking profiles, permission sets, object-level security, sharing settings, and more."

4. **Show the output as it appears**:
   - Point out the progress indicators
   - Highlight any interesting findings
   - Show the final security score

### Scene 3: Generated Reports (1-2 minutes)
**Screen**: File explorer and text editor

**Narration**: 
"The assessment has completed and generated several reports. Let me show you what was created."

**Actions**:
1. Navigate to the reports directory:
   ```bash
   ls -la reports/
   ```

2. Open the Markdown report:
   ```bash
   cat reports/security-audit-report.md
   ```
   - Scroll through to show the structure
   - Highlight the security scores
   - Show the recommendations section

3. If HTML report exists, open it in a browser:
   ```bash
   open reports/security-audit-report.html
   ```
   - Show the visual charts (if available)
   - Demonstrate the interactive elements

4. Show the JSON action plan:
   ```bash
   cat reports/security-action-plan.json | head -20
   ```

### Scene 4: Key Findings Explanation (1 minute)
**Screen**: The generated report (Markdown or HTML)

**Narration**: 
"Let me highlight some key findings from this assessment."

**Actions**:
- Point out the overall security score
- Explain what each category score means
- Show 1-2 specific recommendations
- Explain the priority levels (Critical, High, Medium, Low)

### Scene 5: Wrap-up (30 seconds)
**Screen**: Back to the README or terminal

**Narration**: 
"That's how easy it is to run a comprehensive security assessment on your Salesforce org. The tool provides detailed recommendations and action plans to help you improve your security posture. Check out the README for more advanced usage options and configuration settings."

**Actions**:
- Show the README usage section
- Highlight the different methods available
- End with the GitHub repository URL

## Recording Tips

### Technical Setup
- **Resolution**: 1920x1080 minimum
- **Frame Rate**: 30fps
- **Audio**: Clear microphone, minimize background noise
- **Screen**: Use a clean desktop, close unnecessary applications

### Visual Best Practices
- **Font Size**: Increase terminal font size for readability
- **Cursor**: Use a visible cursor or highlight tool
- **Pace**: Speak slowly and clearly
- **Pauses**: Allow time for viewers to read output

### Content Tips
- **Practice**: Run through the demo several times before recording
- **Backup Plan**: Have a pre-generated report ready in case of connection issues
- **Error Handling**: If something goes wrong, explain what happened and how to fix it
- **Real Data**: Use a real org with some actual security findings for authenticity

## Alternative Approaches

### Option 1: Split into Multiple Short Videos
- Video 1: Quick demo (2 minutes)
- Video 2: Report walkthrough (2 minutes)
- Video 3: Advanced usage (2 minutes)

### Option 2: Animated GIF Alternative
If video recording is challenging, create animated GIFs showing:
1. Running the command
2. Viewing the results
3. Opening the reports

### Option 3: Screenshot Tutorial
Create a step-by-step screenshot tutorial with annotations showing:
1. Terminal commands
2. Output examples
3. Generated reports
4. Key findings

## Post-Recording

### Video Editing
- Add captions/subtitles for accessibility
- Include timestamps in the description
- Add intro/outro with project information

### Upload and Integration
- Upload to YouTube or similar platform
- Add the video link to the README
- Consider creating a thumbnail image

### README Integration
Add this section to the README:

```markdown
## Video Demonstration

Watch a quick demonstration of the Salesforce Security Assessment Tool:

[![Salesforce Security Assessment Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

*3-minute walkthrough showing how to run a security assessment and interpret the results.*
```

## Troubleshooting Common Issues

### If the assessment fails:
- Check SF CLI authentication: `sf org list`
- Verify org permissions
- Show how to read error messages

### If no reports are generated:
- Check the reports directory
- Show how to run with verbose logging
- Demonstrate the mock data demo as fallback

### If connection issues occur:
- Show the authentication process
- Demonstrate offline demo mode
- Explain prerequisites clearly

## Sample Narration Script

"Welcome to the Salesforce Security Assessment Tool demonstration. I'm going to show you how to evaluate your Salesforce organization's security in just a few minutes.

First, let me show you what this tool does. [Show README] It evaluates seven critical security categories including profiles, permissions, data access, and monitoring.

Now let's run an assessment. I've already authenticated with my Salesforce org, so I'll use the quick assessment method. [Run command]

As you can see, the tool is connecting to Salesforce and collecting security data. This includes checking user permissions, object-level security, sharing rules, and more.

Great! The assessment is complete. We got an overall security score of [X] out of 10. Let me show you the detailed reports that were generated.

[Show reports] Here's the comprehensive markdown report with detailed findings and recommendations. Notice how it breaks down scores by category and provides specific action items.

The tool also generates an HTML report with visual charts and a JSON action plan for programmatic use.

Looking at our results, we can see [highlight specific findings]. These recommendations are prioritized by criticality to help you focus on the most important security improvements first.

That's how easy it is to get a comprehensive security assessment of your Salesforce org. Check out the README for more advanced options and configuration settings. Thanks for watching!"
