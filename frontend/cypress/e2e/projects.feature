Feature: Project Management
  As a user
  I want to create and manage projects
  So that I can organize my drift monitoring

  Background:
    Given I am on the projects page

  Scenario: Create a new project
    When I click the "Create Project" button
    And I enter "Test Project" as the project name
    And I submit the project creation form
    Then I should see "Test Project" in the projects list
    And the project should have a valid project ID

  Scenario: View projects list
    Given I have created a project named "Project 1"
    And I have created a project named "Project 2"
    When I navigate to the projects page
    Then I should see at least 2 projects in the list
    And each project should display its name
    And each project should display its creation date

  Scenario: Navigate to project baseline page
    Given I have created a project named "My Project"
    When I click the upload icon for "My Project"
    Then I should be on the baseline upload page
    And the URL should contain the project ID

  Scenario: Navigate to project alerts page
    Given I have created a project named "My Project"
    When I click the alerts icon for "My Project"
    Then I should be on the alerts page
    And the URL should contain the project ID

