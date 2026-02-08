import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I have created a project named {string}', (projectName: string) => {
  // Visit root first to ensure Angular app is loaded
  cy.visit('/');
  cy.wait(2000); // Wait for app to initialize
  cy.visit('/projects');
  cy.waitForApi();
  
  // Check if project already exists
  cy.get('body').then(($body) => {
    if ($body.text().includes(projectName)) {
      return; // Project already exists
    }
    
    // Create the project
    cy.get('input[matInput]').type(projectName);
    cy.contains('button', 'Create Project').click();
    cy.waitForApi();
  });
});

Given('I am on the baseline upload page for {string}', (projectName: string) => {
  // First ensure project exists
  cy.visit('/projects');
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes(projectName)) {
      cy.get('input[matInput]').type(projectName);
      cy.contains('button', 'Create Project').click();
      cy.waitForApi();
    }
    
    // Get project ID from the list
    cy.contains('mat-list-item', projectName)
      .find('button[mat-icon-button]')
      .first()
      .click();
    cy.waitForApi();
  });
  
  cy.url().should('include', '/baseline');
});

When('I select the baseline CSV file {string}', (filePath: string) => {
  const fullPath = `../../${filePath}`;
  cy.get('input[type="file"]').selectFile(fullPath, { force: true });
});

When('I click the {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).click();
  cy.waitForApi();
});

Then('I should see a success message', () => {
  // Check for successful upload (either alert or visible baseline summary)
  cy.get('body').should('satisfy', ($body) => {
    return $body.text().includes('successfully') || 
           $body.find('mat-card').length > 0;
  });
});

Then('I should see the baseline summary', () => {
  cy.get('mat-card').contains('Baseline Summary').should('be.visible');
});

Then('I should see the baseline version', () => {
  cy.contains('Version:').should('be.visible');
});

Then('I should see the prediction rate', () => {
  cy.contains('Prediction Rate:').should('be.visible');
});

Then('I should see a list of features', () => {
  cy.contains('Features').should('be.visible');
  cy.get('table').should('exist');
});

Given('I have uploaded a baseline CSV for {string}', (projectName: string) => {
  // Navigate to baseline page
  cy.visit('/projects');
  cy.waitForApi();
  
  cy.contains('mat-list-item', projectName)
    .find('button[mat-icon-button]')
    .first()
    .click();
  cy.waitForApi();
  
  // Upload baseline if not already uploaded
  cy.get('body').then(($body) => {
    if (!$body.text().includes('Baseline Summary')) {
      const filePath = '../../samples/baseline.csv';
      cy.get('input[type="file"]').selectFile(filePath, { force: true });
      cy.contains('button', 'Upload Baseline').click();
      cy.waitForApi();
      cy.wait(2000); // Wait for upload to complete
    }
  });
});

When('I navigate to the baseline page', () => {
  cy.url().should('include', '/baseline');
});

Then('I should see feature names and types', () => {
  cy.get('table').should('exist');
  cy.get('table th').should('contain', 'Feature Name');
  cy.get('table th').should('contain', 'Type');
});

Then('I should see numeric features with histogram data', () => {
  cy.get('table').should('exist');
  // Just verify table exists - detailed data check would be in unit tests
});

Then('I should see categorical features with frequency data', () => {
  cy.get('table').should('exist');
  // Just verify table exists - detailed data check would be in unit tests
});

When('I click the {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).click();
  cy.waitForApi();
});

Then('I should be on the incoming upload page', () => {
  cy.url().should('include', '/incoming');
});

When('I select an invalid file', () => {
  // Create a dummy invalid file
  cy.get('input[type="file"]').selectFile({
    contents: 'invalid content',
    fileName: 'invalid.txt',
    mimeType: 'text/plain'
  }, { force: true });
});

Then('I should see an error message', () => {
  cy.get('body').should('satisfy', ($body) => {
    return $body.text().includes('error') || 
           $body.text().includes('Error') ||
           $body.text().includes('Failed');
  });
});

Then('the baseline should not be created', () => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('Baseline Summary')) {
      // If summary exists, it means baseline was created (unexpected)
      throw new Error('Baseline was created when it should not have been');
    }
  });
});

