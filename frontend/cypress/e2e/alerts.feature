Feature: Alerts Management
  As a user
  I want to view and manage alerts
  So that I can monitor drift issues

  Background:
    Given I have created a project named "Test Project"
    And I have uploaded a baseline CSV for "Test Project"
    And I have uploaded incoming data that created alerts

  Scenario: View all alerts
    Given I am on the alerts page for "Test Project"
    When the page loads
    Then I should see a list of alerts
    And each alert should display its severity
    And each alert should display its type
    And each alert should display its message
    And each alert should display its creation time

  Scenario: Filter alerts by severity
    Given I am on the alerts page for "Test Project"
    When I select "WARN" from the severity filter
    Then I should only see alerts with severity "WARN"
    When I select "CRITICAL" from the severity filter
    Then I should only see alerts with severity "CRITICAL"
    When I select "All" from the severity filter
    Then I should see all alerts

  Scenario: Filter alerts by status
    Given I am on the alerts page for "Test Project"
    When I select "OPEN" from the status filter
    Then I should only see alerts with status "OPEN"
    When I select "ACK" from the status filter
    Then I should only see acknowledged alerts

  Scenario: View alert details
    Given I am on the alerts page for "Test Project"
    And there is at least one alert
    When I click the info icon on an alert
    Then I should see alert details including:
      | Field          |
      | Alert ID       |
      | Type           |
      | Severity       |
      | Feature Name   |
      | Metric Value   |
      | Baseline Version |
      | Message        |

  Scenario: Acknowledge an alert
    Given I am on the alerts page for "Test Project"
    And there is at least one open alert
    When I click the acknowledge button on an alert
    Then the alert status should change to "ACK"
    And the alert should no longer show acknowledge button

  Scenario: View feature drift alerts
    Given I am on the alerts page for "Test Project"
    When I view alerts of type "FEATURE_DRIFT"
    Then I should see the feature name
    And I should see the drift metric value
    And the severity should be "WARN" or "CRITICAL"

  Scenario: View prediction shift alerts
    Given I am on the alerts page for "Test Project"
    When I view alerts of type "PREDICTION_SHIFT"
    Then I should see the prediction shift metric value
    And the alert should not have a feature name
    And the severity should be "WARN" or "CRITICAL"

  Scenario: View schema validation alerts
    Given I am on the alerts page for "Test Project"
    When I view alerts of type "SCHEMA"
    Then I should see the feature name if applicable
    And the severity should indicate the issue type

