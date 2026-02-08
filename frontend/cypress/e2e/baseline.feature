Feature: Baseline Upload
  As a user
  I want to upload baseline CSV files
  So that I can establish a reference for drift detection

  Background:
    Given I have created a project named "Test Project"
    And I am on the baseline upload page for "Test Project"

  Scenario: Upload baseline CSV successfully
    When I select the baseline CSV file "samples/baseline.csv"
    And I click the "Upload Baseline" button
    Then I should see a success message
    And I should see the baseline summary
    And I should see the baseline version
    And I should see the prediction rate
    And I should see a list of features

  Scenario: View baseline summary
    Given I have uploaded a baseline CSV for "Test Project"
    When I navigate to the baseline page
    Then I should see the baseline version
    And I should see the prediction rate
    And I should see feature names and types
    And I should see numeric features with histogram data
    And I should see categorical features with frequency data

  Scenario: Navigate to incoming upload from baseline page
    Given I have uploaded a baseline CSV for "Test Project"
    When I click the "Upload Incoming Data" button
    Then I should be on the incoming upload page
    And the URL should contain the project ID

  Scenario: Handle invalid CSV file
    When I select an invalid file
    And I click the "Upload Baseline" button
    Then I should see an error message
    And the baseline should not be created

