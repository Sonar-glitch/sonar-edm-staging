/**
 * Deploy Button Script for Sonar EDM Platform
 * 
 * This script adds a one-click deployment button to the application
 * that allows users to easily deploy the platform to Heroku.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create deploy button container
  const deployContainer = document.createElement('div');
  deployContainer.className = 'deploy-container';
  deployContainer.style.position = 'fixed';
  deployContainer.style.bottom = '20px';
  deployContainer.style.right = '20px';
  deployContainer.style.zIndex = '1000';
  
  // Create deploy button
  const deployButton = document.createElement('button');
  deployButton.className = 'deploy-button';
  deployButton.innerHTML = '🚀 Deploy to Heroku';
  deployButton.style.backgroundColor = '#6567a5';
  deployButton.style.color = 'white';
  deployButton.style.border = 'none';
  deployButton.style.borderRadius = '4px';
  deployButton.style.padding = '12px 20px';
  deployButton.style.fontSize = '16px';
  deployButton.style.fontWeight = 'bold';
  deployButton.style.cursor = 'pointer';
  deployButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  deployButton.style.display = 'flex';
  deployButton.style.alignItems = 'center';
  deployButton.style.justifyContent = 'center';
  deployButton.style.gap = '8px';
  
  // Add hover effect
  deployButton.onmouseover = function() {
    this.style.backgroundColor = '#7b7cc7';
  };
  deployButton.onmouseout = function() {
    this.style.backgroundColor = '#6567a5';
  };
  
  // Add click event
  deployButton.onclick = function() {
    // Show deployment modal
    showDeploymentModal();
  };
  
  // Add button to container
  deployContainer.appendChild(deployButton);
  
  // Add container to body
  document.body.appendChild(deployContainer);
});

/**
 * Show deployment modal
 */
function showDeploymentModal() {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
  backdrop.style.zIndex = '1001';
  backdrop.style.display = 'flex';
  backdrop.style.alignItems = 'center';
  backdrop.style.justifyContent = 'center';
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'deploy-modal';
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '8px';
  modal.style.padding = '24px';
  modal.style.width = '500px';
  modal.style.maxWidth = '90%';
  modal.style.maxHeight = '90%';
  modal.style.overflowY = 'auto';
  modal.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  
  // Create modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '16px';
  
  const title = document.createElement('h2');
  title.textContent = 'Deploy to Heroku';
  title.style.margin = '0';
  title.style.fontSize = '20px';
  title.style.fontWeight = 'bold';
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0';
  closeButton.style.lineHeight = '1';
  closeButton.onclick = function() {
    document.body.removeChild(backdrop);
  };
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create modal content
  const content = document.createElement('div');
  content.className = 'modal-content';
  
  // Create deployment steps
  const steps = [
    {
      title: 'Configure Environment Variables',
      description: 'Set up your Spotify API credentials, MongoDB connection, and NextAuth secret.'
    },
    {
      title: 'Deploy to Heroku',
      description: 'Click the button below to deploy your application to Heroku.'
    },
    {
      title: 'Verify Deployment',
      description: 'Once deployed, verify that your application is running correctly.'
    }
  ];
  
  steps.forEach((step, index) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'deploy-step';
    stepElement.style.marginBottom = '16px';
    
    const stepTitle = document.createElement('h3');
    stepTitle.textContent = `Step ${index + 1}: ${step.title}`;
    stepTitle.style.margin = '0 0 8px 0';
    stepTitle.style.fontSize = '16px';
    stepTitle.style.fontWeight = 'bold';
    
    const stepDescription = document.createElement('p');
    stepDescription.textContent = step.description;
    stepDescription.style.margin = '0';
    stepDescription.style.fontSize = '14px';
    
    stepElement.appendChild(stepTitle);
    stepElement.appendChild(stepDescription);
    content.appendChild(stepElement);
  });
  
  // Create environment variables form
  const form = document.createElement('form');
  form.className = 'env-form';
  form.style.marginTop = '24px';
  form.style.marginBottom = '24px';
  
  const formTitle = document.createElement('h3');
  formTitle.textContent = 'Environment Variables';
  formTitle.style.margin = '0 0 16px 0';
  formTitle.style.fontSize = '16px';
  formTitle.style.fontWeight = 'bold';
  
  form.appendChild(formTitle);
  
  // Create form fields
  const fields = [
    { name: 'SPOTIFY_CLIENT_ID', label: 'Spotify Client ID', type: 'text' },
    { name: 'SPOTIFY_CLIENT_SECRET', label: 'Spotify Client Secret', type: 'password' },
    { name: 'MONGODB_URI', label: 'MongoDB URI', type: 'text' },
    { name: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', type: 'text' }
  ];
  
  fields.forEach(field => {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-field';
    fieldContainer.style.marginBottom = '12px';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.style.display = 'block';
    label.style.marginBottom = '4px';
    label.style.fontSize = '14px';
    
    const input = document.createElement('input');
    input.type = field.type;
    input.name = field.name;
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.borderRadius = '4px';
    input.style.border = '1px solid #ccc';
    input.style.fontSize = '14px';
    
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  });
  
  content.appendChild(form);
  
  // Create deploy button
  const deployButtonContainer = document.createElement('div');
  deployButtonContainer.style.textAlign = 'center';
  
  const herokuButton = document.createElement('a');
  herokuButton.href = 'https://heroku.com/deploy';
  herokuButton.target = '_blank';
  herokuButton.className = 'heroku-deploy-button';
  herokuButton.innerHTML = '<img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku">';
  herokuButton.style.display = 'inline-block';
  
  // Add click event to collect form data
  herokuButton.onclick = function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      if (value) {
        params.append(key, value);
      }
    }
    
    // Add app.json parameters
    params.append('template', 'https://github.com/Sonar-glitch/sonar-edm-platform');
    
    // Open Heroku deploy page with parameters
    window.open(`https://heroku.com/deploy?${params.toString()}`, '_blank');
  };
  
  deployButtonContainer.appendChild(herokuButton);
  content.appendChild(deployButtonContainer);
  
  // Add note about CLI deployment
  const note = document.createElement('p');
  note.textContent = 'Note: For more advanced deployment options, use the deploy.js script in the scripts directory.';
  note.style.marginTop = '24px';
  note.style.fontSize = '12px';
  note.style.color = '#666';
  note.style.textAlign = 'center';
  
  content.appendChild(note);
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(content);
  backdrop.appendChild(modal);
  
  // Add to body
  document.body.appendChild(backdrop);
}
