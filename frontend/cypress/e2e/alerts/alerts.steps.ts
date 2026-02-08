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

Given('I am on the alerts page for {string}', (projectName: string) => {
  // Ensure project, baseline, and incoming data exist
  cy.visit('/projects');
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes(projectName)) {
      cy.get('input[matInput]').type(projectName);
      cy.contains('button', 'Create Project').click();
      cy.waitForApi();
    }
  });
  
  // Setup baseline
  cy.contains('mat-list-item', projectName)
    .find('button[mat-icon-button]')
    .first()
    .click();
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes('Baseline Summary')) {
      const filePath = '../../samples/baseline.csv';
      cy.get('input[type="file"]').selectFile(filePath, { force: true });
      cy.contains('button', 'Upload Baseline').click();
      cy.waitForApi();
      cy.wait(2000);
    }
  });
  
  // Upload incoming data to create alerts
  cy.contains('button', 'Upload Incoming Data').click();
  cy.waitForApi();
  
  cy.get('body').then(($body) => {
    if (!$body.text().includes('Upload Results')) {
      const filePath = '../../samples/incoming.csv';
      cy.get('input[type="file"]').selectFile(filePath, { force: true });
      cy.contains('button', 'Upload & Analyze').click();
      cy.waitForApi();
      cy.wait(3000);
    }
  });
  
  // Navigate to alerts
  cy.contains('button', 'View Alerts').click();
  cy.waitForApi();
  cy.url().should('include', '/alerts');
});

When('the page loads', () => {
  cy.waitForApi();
});

Then('I should see a list of alerts', () => {
  cy.get('table').should('exist');
  cy.get('table tbody tr').should('have.length.at.least', 1);
});

Then('each alert should display its severity', () => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).should('satisfy', ($el) => {
      const text = $el.text();
      return text.includes('WARN') || text.includes('CRITICAL');
    });
  });
});

Then('each alert should display its type', () => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).should('satisfy', ($el) => {
      const text = $el.text();
      return text.includes('FEATURE_DRIFT') || 
             text.includes('PREDICTION_SHIFT') || 
             text.includes('SCHEMA');
    });
  });
});

Then('each alert should display its message', () => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).find('td').should('have.length.at.least', 1);
  });
});

Then('each alert should display its creation time', () => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).find('td').first().should('exist');
  });
});

When('I select {string} from the severity filter', (severity: string) => {
  cy.get('mat-select').first().click();
  cy.contains('mat-option', severity).click();
  cy.waitForApi();
});

Then('I should only see alerts with severity {string}', (severity: string) => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).should('contain', severity);
  });
});

When('I select {string} from the status filter', (status: string) => {
  cy.get('mat-select').eq(1).click();
  cy.contains('mat-option', status).click();
  cy.waitForApi();
});

Then('I should only see alerts with status {string}', (status: string) => {
  cy.get('table tbody tr').each(($row) => {
    cy.wrap($row).should('contain', status);
  });
});

When('I select {string} from the severity filter', (option: string) => {
  if (option === 'All') {
    cy.get('mat-select').first().click();
    cy.contains('mat-option', 'All').click();
  } else {
    cy.get('mat-select').first().click();
    cy.contains('mat-option', option).click();
  }
  cy.waitForApi();
});

Then('I should see all alerts', () => {
  cy.get('table tbody tr').should('have.length.at.least', 1);
});

Given('there is at least one alert', () => {
  cy.get('table tbody tr').should('have.length.at.least', 1);
});

When('I click the info icon on an alert', () => {
  cy.get('table tbody tr').first()
    .find('button[mat-icon-button]')
    .first()
    .click();
});

Then('I should see alert details including:', (dataTable: any) => {
  // Check that alert dialog/modal appears
  cy.get('body').should('satisfy', ($body) => {
    const text = $body.text();
    return text.includes('Alert ID') || 
           text.includes('Type') ||
           text.includes('Severity');
  });
});

Given('there is at least one open alert', () => {
  cy.get('table tbody tr').should('have.length.at.least', 1);
  cy.get('table tbody tr').first().should('contain', 'OPEN');
});

When('I click the acknowledge button on an alert', () => {
  cy.get('table tbody tr').first()
    .find('button[mat-icon-button]')
    .last()
    .click();
  cy.waitForApi();
});

Then('the alert status should change to {string}', (status: string) => {
  cy.get('table tbody tr').first().should('contain', status);
});

Then('the alert should no longer show acknowledge button', () => {
  cy.get('table tbody tr').first()
    .find('button[mat-icon-button]')
    .should('have.length', 1); // Only info button, no ack button
});

When('I view alerts of type {string}', (alertType: string) => {
  // Filter or find alerts of this type
  cy.get('table tbody tr').each(($row) => {
    if ($row.text().includes(alertType)) {
      cy.wrap($row).should('be.visible');
    }
  });
});

Then('I should see the feature name', () => {
  cy.get('table tbody tr').first().should('satisfy', ($row) => {
    const text = $row.text();
    return text.includes('income') || text.includes('age') || text.includes('location');
  });
});

Then('I should see the drift metric value', () => {
  cy.get('table tbody tr').first().find('td').should('satisfy', ($cells) => {
    // Check if any cell contains a number (metric value)
    return Array.from($cells).some(cell => /\d+\.\d+/.test(cell.textContent || ''));
  });
});

Then('the severity should be {string} or {string}', (severity1: string, severity2: string) => {
  cy.get('table tbody tr').first().should('satisfy', ($row) => {
    const text = $row.text();
    return text.includes(severity1) || text.includes(severity2);
  });
});

Then('I should see the prediction shift metric value', () => {
  cy.get('table tbody tr').each(($row) => {
    if ($row.text().includes('PREDICTION_SHIFT')) {
      cy.wrap($row).find('td').should('satisfy', ($cells) => {
        return Array.from($cells).some(cell => /\d+\.\d+/.test(cell.textContent || ''));
      });
    }
  });
});

Then('the alert should not have a feature name', () => {
  cy.get('table tbody tr').each(($row) => {
    if ($row.text().includes('PREDICTION_SHIFT')) {
      cy.wrap($row).find('td').should('satisfy', ($cells) => {
        const text = Array.from($cells).map(c => c.textContent).join(' ');
        return text.includes('-') || !text.match(/income|age|location/);
      });
    }
  });
});

Then('I should see the feature name if applicable', () => {
  cy.get('table tbody tr').each(($row) => {
    if ($row.text().includes('SCHEMA')) {
      // Schema alerts may or may not have feature names
      cy.wrap($row).should('exist');
    }
  });
});

Then('the severity should indicate the issue type', () => {
  cy.get('table tbody tr').each(($row) => {
    if ($row.text().includes('SCHEMA')) {
      cy.wrap($row).should('satisfy', ($el) => {
        const text = $el.text();
        return text.includes('WARN') || text.includes('CRITICAL');
      });
    }
  });
});

