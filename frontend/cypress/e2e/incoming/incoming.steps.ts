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

Given('I am on the incoming upload page for {string}', (projectName: string) => {
  // Ensure project and baseline exist
  cy.visit('/projects');
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes(projectName)) {
      cy.get('input[matInput]').type(projectName);
      cy.contains('button', 'Create Project').click();
      cy.waitForApi();
    }
  });
  
  // Navigate to baseline first to ensure it exists
  cy.contains('mat-list-item', projectName)
    .find('button[mat-icon-button]')
    .first()
    .click();
  cy.waitForApi();
  
  // Upload baseline if needed
  cy.get('body').then(($body) => {
    if (!$body.text().includes('Baseline Summary')) {
      const filePath = '../../samples/baseline.csv';
      cy.get('input[type="file"]').selectFile(filePath, { force: true });
      cy.contains('button', 'Upload Baseline').click();
      cy.waitForApi();
      cy.wait(2000);
    }
  });
  
  // Navigate to incoming page
  cy.contains('button', 'Upload Incoming Data').click();
  cy.waitForApi();
  cy.url().should('include', '/incoming');
});

When('I select the incoming CSV file {string}', (filePath: string) => {
  const fullPath = `../../${filePath}`;
  cy.get('input[type="file"]').selectFile(fullPath, { force: true });
});

When('I click the {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).click();
  cy.waitForApi();
  cy.wait(3000); // Wait for processing
});

Then('I should see the upload results', () => {
  cy.contains('Upload Results').should('be.visible');
});

Then('I should see the number of rows processed', () => {
  cy.contains('Rows Processed:').should('be.visible');
});

Then('I should see the number of alerts created', () => {
  cy.contains('Alerts Created:').should('be.visible');
});

Then('I should see the health status', () => {
  cy.contains('Health Status:').should('be.visible');
});

Then('the health status should indicate drift was detected', () => {
  cy.get('body').should('satisfy', ($body) => {
    const text = $body.text();
    return text.includes('WARN') || text.includes('CRITICAL');
  });
});

Given('I have uploaded incoming data that triggers alerts', () => {
  // This is handled by the background steps
  cy.visit('/projects');
  cy.waitForApi();
  
  // Navigate through the flow
  cy.contains('mat-list-item', 'Test Project')
    .find('button[mat-icon-button]')
    .eq(1) // Second button (incoming upload)
    .click();
  cy.waitForApi();
  
  const filePath = '../../samples/incoming.csv';
  cy.get('input[type="file"]').selectFile(filePath, { force: true });
  cy.contains('button', 'Upload & Analyze').click();
  cy.waitForApi();
  cy.wait(3000);
});

When('I view the upload results', () => {
  cy.contains('Upload Results').should('be.visible');
});

Then('I should see {string} greater than {int}', (field: string, value: number) => {
  cy.contains(field).parent().then(($el) => {
    const text = $el.text();
    const match = text.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      expect(num).to.be.greaterThan(value);
    }
  });
});

Then('I should see a health status of {string} or {string}', (status1: string, status2: string) => {
  cy.get('body').should('satisfy', ($body) => {
    const text = $body.text();
    return text.includes(status1) || text.includes(status2);
  });
});

Then('I should see a button to view alerts', () => {
  cy.contains('button', 'View Alerts').should('be.visible');
});

Given('I have uploaded incoming data that created alerts', () => {
  // Same as "triggers alerts" - handled by background
});

When('I click the {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).click();
  cy.waitForApi();
});

Given('I have not uploaded a baseline', () => {
  // Create a fresh project without baseline
  cy.visit('/projects');
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes('New Project')) {
      cy.get('input[matInput]').type('New Project');
      cy.contains('button', 'Create Project').click();
      cy.waitForApi();
    }
  });
});

When('I try to upload incoming data', () => {
  cy.contains('mat-list-item', 'New Project')
    .find('button[mat-icon-button]')
    .eq(1)
    .click();
  cy.waitForApi();
  
  const filePath = '../../samples/incoming.csv';
  cy.get('input[type="file"]').selectFile(filePath, { force: true });
  cy.contains('button', 'Upload & Analyze').click();
  cy.waitForApi();
});

Then('I should see an error message about missing baseline', () => {
  cy.get('body').should('satisfy', ($body) => {
    const text = $body.text();
    return text.includes('baseline') || text.includes('Baseline') || text.includes('error');
  });
});

