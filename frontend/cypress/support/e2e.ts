// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent TypeScript errors
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for API calls to complete
       * @example cy.waitForApi()
       */
      waitForApi(): Chainable<void>;
      
      /**
       * Custom command to upload a file
       * @example cy.uploadFile('input[type="file"]', 'path/to/file.csv')
       */
      uploadFile(selector: string, filePath: string): Chainable<void>;
    }
  }
}

// Wait for servers to be ready before running tests
before(() => {
  // Wait for backend server to be ready
  cy.request({
    url: 'http://localhost:8080/api/projects',
    method: 'GET',
    failOnStatusCode: false, // Backend might return empty array, which is OK
    retryOnNetworkFailure: true,
    timeout: 30000,
  }).then((response) => {
    // Backend should return 200 (even if empty array) or at least not 500
    if (response.status >= 500) {
      throw new Error(`Backend server returned status ${response.status}`);
    }
  });

  // For frontend, we'll let Cypress handle the waiting when it visits pages
  // The Angular dev server needs time to compile, and cy.visit() will retry automatically
});

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

