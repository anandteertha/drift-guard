# Cypress E2E Tests with Gherkin

This directory contains end-to-end tests written in Gherkin (Cucumber) syntax and executed with Cypress.

## Structure

```
cypress/
├── e2e/
│   ├── *.feature          # Gherkin feature files
│   ├── projects/
│   │   └── projects.steps.ts  # Step definitions for projects
│   ├── baseline/
│   │   └── baseline.steps.ts  # Step definitions for baseline
│   ├── incoming/
│   │   └── incoming.steps.ts   # Step definitions for incoming
│   └── alerts/
│       └── alerts.steps.ts     # Step definitions for alerts
├── fixtures/              # Test data fixtures
├── support/
│   ├── commands.ts        # Custom Cypress commands
│   └── e2e.ts            # Support file
└── README.md             # This file
```

## Running Tests

### Interactive Mode
```bash
npm run e2e
```
Opens Cypress Test Runner GUI where you can select and run tests.

### Headless Mode
```bash
npm run e2e:headless
```
Runs all tests in headless mode (no browser GUI).

### CI Mode
```bash
npm run e2e:ci
```
Optimized for CI environments.

## Prerequisites

Before running E2E tests:
1. **Backend must be running**: `cd backend && cargo run`
2. **Frontend must be running**: `cd frontend && npm start`
3. Backend should be accessible at `http://127.0.0.1:8080`
4. Frontend should be accessible at `http://localhost:4200`

## Writing Tests

### Feature Files
Feature files use Gherkin syntax:
```gherkin
Feature: Feature Name
  As a user
  I want to do something
  So that I can achieve a goal

  Scenario: Test scenario
    Given some precondition
    When I perform an action
    Then I should see a result
```

### Step Definitions
Step definitions map Gherkin steps to Cypress commands:
```typescript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the projects page', () => {
  cy.visit('/projects');
});
```

## Test Coverage

- **Projects**: Create, list, and navigate projects
- **Baseline**: Upload baseline CSV, view summary
- **Incoming**: Upload incoming data, detect drift, view results
- **Alerts**: View, filter, acknowledge alerts

## Best Practices

1. Use Background steps for common setup
2. Keep scenarios independent (can run in any order)
3. Use data tables for structured assertions
4. Clean up test data when possible
5. Use custom commands for reusable actions

