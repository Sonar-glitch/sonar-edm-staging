const fs = require('fs');
const path = require('path');

// Find the dashboard file
const findDashboardFile = () => {
  const possiblePaths = [
    'pages/dashboard.js',
    'pages/dashboard/index.js',
    'src/pages/dashboard.js',
    'src/pages/dashboard/index.js',
    'app/dashboard/page.js'
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Found dashboard file at: ${filePath}`);
      return filePath;
    }
  }
  
  console.log('Dashboard file not found in common locations');
  return null;
};

// Add script tag to dashboard
const addScriptToDashboard = (dashboardPath) => {
  if (!dashboardPath) return false;
  
  try {
    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check if script is already added
    if (content.includes('events-section-fix.js')) {
      console.log('Script already added to dashboard');
      return true;
    }
    
    // Find the closing head tag or create a script section
    if (content.includes('</Head>')) {
      // Next.js with Head component
      content = content.replace(
        '</Head>',
        '  <script src="/js/events-section-fix.js" defer></script>\n  </Head>'
      );
    } else if (content.includes('<head>')) {
      // HTML head tag
      content = content.replace(
        '</head>',
        '  <script src="/js/events-section-fix.js" defer></script>\n  </head>'
      );
    } else {
      // Add to the end of imports
      const importEndIndex = content.lastIndexOf('import');
      if (importEndIndex !== -1) {
        const importEndLine = content.indexOf('\n', importEndIndex);
        if (importEndLine !== -1) {
          content = 
            content.substring(0, importEndLine + 1) + 
            '\n// Add client-side fix for events section\n' +
            'export function Head() {\n' +
            '  return (\n' +
            '    <>\n' +
            '      <script src="/js/events-section-fix.js" defer></script>\n' +
            '    </>\n' +
            '  );\n' +
            '}\n\n' +
            content.substring(importEndLine + 1);
        }
      }
    }
    
    fs.writeFileSync(dashboardPath, content, 'utf8');
    console.log(`Added script to dashboard at: ${dashboardPath}`);
    return true;
  } catch (error) {
    console.error('Error adding script to dashboard:', error);
    return false;
  }
};

// Create a custom document file if needed
const createCustomDocument = () => {
  const customDocPath = 'pages/_document.js';
  
  // Check if custom document already exists
  if (fs.existsSync(customDocPath)) {
    console.log('Custom document already exists, updating...');
    try {
      let content = fs.readFileSync(customDocPath, 'utf8');
      
      // Check if script is already added
      if (content.includes('events-section-fix.js')) {
        console.log('Script already added to custom document');
        return true;
      }
      
      // Add script to head
      if (content.includes('</Head>')) {
        content = content.replace(
          '</Head>',
          '          <script src="/js/events-section-fix.js" defer></script>\n          </Head>'
        );
        
        fs.writeFileSync(customDocPath, content, 'utf8');
        console.log('Updated custom document with script');
        return true;
      }
    } catch (error) {
      console.error('Error updating custom document:', error);
    }
  }
  
  // Create new custom document
  const documentContent = `
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script src="/js/events-section-fix.js" defer></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
`;

  try {
    // Create pages directory if it doesn't exist
    if (!fs.existsSync('pages')) {
      fs.mkdirSync('pages');
    }
    
    fs.writeFileSync(customDocPath, documentContent, 'utf8');
    console.log(`Created custom document at: ${customDocPath}`);
    return true;
  } catch (error) {
    console.error('Error creating custom document:', error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Adding events fix to dashboard...');
  
  // Find and update dashboard file
  const dashboardPath = findDashboardFile();
  const dashboardUpdated = addScriptToDashboard(dashboardPath);
  
  // If dashboard update failed, create or update custom document
  if (!dashboardUpdated) {
    console.log('Dashboard update failed, creating custom document...');
    createCustomDocument();
  }
  
  console.log('Events fix added to dashboard!');
};

main();
