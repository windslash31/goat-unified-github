const db = require("../../config/db");

const getAtlassianSyncData = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const queries = {
      atlassian_users: "SELECT * FROM atlassian_users;",
      atlassian_groups: "SELECT * FROM atlassian_groups;",
      atlassian_group_members: "SELECT * FROM atlassian_group_members;",
      bitbucket_repositories: "SELECT * FROM bitbucket_repositories;",
      bitbucket_repository_permissions:
        "SELECT * FROM bitbucket_repository_permissions;",
      confluence_spaces: "SELECT * FROM confluence_space;",
      confluence_space_permissions:
        "SELECT * FROM confluence_space_permission;",
      confluence_users: "SELECT * FROM confluence_users;",
      jira_projects: "SELECT * FROM jira_projects;",
      jira_project_permissions: "SELECT * FROM jira_project_permissions;",
      jira_roles: "SELECT * FROM jira_roles;",
    };

    const results = await Promise.all(
      Object.values(queries).map((query) => client.query(query))
    );

    const responseData = Object.keys(queries).reduce((acc, key, index) => {
      acc[key] = results[index].rows;
      return acc;
    }, {});

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching Atlassian sync data:", error);
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getAtlassianSyncData,
};
