import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Background step
Given('I am on the projects page', () => {
  // Visit root first to ensure Angular app is loaded
  cy.visit('/');
  cy.wait(2000); // Wait for app to initialize
  cy.visit('/projects');
  cy.waitForApi();
});

// Create project steps
When('I click the {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).click();
});

When('I enter {string} as the project name', (projectName: string) => {
  cy.get('input[matInput]').type(projectName);
});

When('I submit the project creation form', () => {
  cy.contains('button', 'Create Project').click();
  cy.waitForApi();
});

Then('I should see {string} in the projects list', (projectName: string) => {
  cy.contains(projectName).should('be.visible');
});

Then('the project should have a valid project ID', () => {
  cy.get('mat-list-item').first().should('exist');
});

// View projects list
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

When('I navigate to the projects page', () => {
  cy.visit('/projects');
  cy.waitForApi();
});

Then('I should see at least {int} projects in the list', (count: number) => {
  cy.get('mat-list-item').should('have.length.at.least', count);
});

Then('each project should display its name', () => {
  cy.get('mat-list-item').each(($item) => {
    cy.wrap($item).find('[matListItemTitle]').should('exist');
  });
});

Then('each project should display its creation date', () => {
  cy.get('mat-list-item').each(($item) => {
    cy.wrap($item).find('[matListItemLine]').should('exist');
  });
});

// Navigate to baseline
When('I click the upload icon for {string}', (projectName: string) => {
  cy.contains('mat-list-item', projectName)
    .find('button[mat-icon-button]')
    .first()
    .click();
  cy.waitForApi();
});

Then('I should be on the baseline upload page', () => {
  cy.url().should('include', '/baseline');
});

Then('the URL should contain the project ID', () => {
  cy.url().should('match', /\/projects\/[^/]+\/baseline/);
});

// Navigate to alerts
When('I click the alerts icon for {string}', (projectName: string) => {
  cy.contains('mat-list-item', projectName)
    .find('button[mat-icon-button]')
    .last()
    .click();
  cy.waitForApi();
});

Then('I should be on the alerts page', () => {
  cy.url().should('include', '/alerts');
});

