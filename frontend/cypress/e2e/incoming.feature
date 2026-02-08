Feature: Incoming Data Upload and Drift Detection
  As a user
  I want to upload incoming data batches
  So that I can detect drift from the baseline

  Background:
    Given I have created a project named "Test Project"
    And I have uploaded a baseline CSV for "Test Project"

  Scenario: Upload incoming CSV and detect drift
    Given I am on the incoming upload page for "Test Project"
    When I select the incoming CSV file "samples/incoming.csv"
    And I click the "Upload & Analyze" button
    Then I should see the upload results
    And I should see the number of rows processed
    And I should see the number of alerts created
    And I should see the health status
    And the health status should indicate drift was detected

  Scenario: View upload results with alerts
    Given I have uploaded incoming data that triggers alerts
    When I view the upload results
    Then I should see "rows_processed" greater than 0
    And I should see "alerts_created" greater than 0
    And I should see a health status of "WARN" or "CRITICAL"
    And I should see a button to view alerts

  Scenario: Navigate to alerts from upload results
    Given I have uploaded incoming data that created alerts
    When I click the "View Alerts" button
    Then I should be on the alerts page
    And I should see the generated alerts

  Scenario: Upload incoming data without baseline
    Given I have created a project named "New Project"
    And I have not uploaded a baseline
    When I navigate to the incoming upload page
    And I try to upload incoming data
    Then I should see an error message about missing baseline

