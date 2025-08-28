const { fetchData } = require("../../utils/dbHelpers"); // Import the shared helper

const getAtlassianData = async (req, res, next) => {
  try {
    const atlassianUsersQuery = `
        SELECT 
          account_id, email_address, display_name, account_status, 
          billable, product_access, last_updated_at, last_active_date 
        FROM atlassian_users;
      `;
    const queries = {
      atlassian_users: atlassianUsersQuery,
      atlassian_groups: "SELECT * FROM atlassian_groups;",
      atlassian_group_members: "SELECT * FROM atlassian_group_members;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Atlassian data:", error);
    next(error);
  }
};

const getBitbucketData = async (req, res, next) => {
  try {
    const queries = {
      bitbucket_repositories: "SELECT * FROM bitbucket_repositories;",
      bitbucket_repository_permissions:
        "SELECT * FROM bitbucket_repository_permissions;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Bitbucket data:", error);
    next(error);
  }
};

const getConfluenceData = async (req, res, next) => {
  try {
    const queries = {
      confluence_spaces: "SELECT * FROM confluence_space;",
      confluence_space_permissions:
        "SELECT * FROM confluence_space_permission;",
      confluence_users: "SELECT * FROM confluence_users;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Confluence data:", error);
    next(error);
  }
};

const getJiraData = async (req, res, next) => {
  try {
    const queries = {
      jira_projects: "SELECT * FROM jira_projects;",
      jira_project_permissions: "SELECT * FROM jira_project_permissions;",
      jira_roles: "SELECT * FROM jira_roles;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Jira data:", error);
    next(error);
  }
};

module.exports = {
  getAtlassianData,
  getBitbucketData,
  getConfluenceData,
  getJiraData,
};
