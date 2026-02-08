/// <reference types="cypress" />

Cypress.Commands.add('waitForApi', () => {
  cy.wait(1000); // Wait for API calls to complete
});

Cypress.Commands.add('uploadFile', (selector: string, filePath: string) => {
  cy.get(selector).selectFile(filePath, { force: true });
});

export {};

