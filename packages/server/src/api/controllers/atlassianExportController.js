const { fetchData } = require("../../utils/dbHelpers");

// --- Organization-Level Functions ---

const getUsers = async (req, res, next) => {
  try {
    const query = { atlassian_users: "SELECT * FROM atlassian_users;" };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const query = { atlassian_groups: "SELECT * FROM atlassian_groups;" };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getGroupMembers = async (req, res, next) => {
  try {
    const query = {
      atlassian_group_members: "SELECT * FROM atlassian_group_members;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// --- Product-Specific Functions ---

const getJiraProjects = async (req, res, next) => {
  try {
    const query = { jira_projects: "SELECT * FROM jira_projects;" };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getJiraPermissions = async (req, res, next) => {
  try {
    const query = {
      jira_project_permissions: "SELECT * FROM jira_project_permissions;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getJiraRoles = async (req, res, next) => {
  try {
    const query = { jira_roles: "SELECT * FROM jira_roles;" };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getConfluenceSpaces = async (req, res, next) => {
  try {
    const query = { confluence_spaces: "SELECT * FROM confluence_space;" };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getConfluencePermissions = async (req, res, next) => {
  try {
    const query = {
      confluence_space_permissions:
        "SELECT * FROM confluence_space_permission;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getBitbucketRepositories = async (req, res, next) => {
  try {
    const query = {
      bitbucket_repositories: "SELECT * FROM bitbucket_repositories;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getBitbucketPermissions = async (req, res, next) => {
  try {
    const query = {
      bitbucket_repository_permissions:
        "SELECT * FROM bitbucket_repository_permissions;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getGroups,
  getGroupMembers,
  getJiraProjects,
  getJiraPermissions,
  getJiraRoles,
  getConfluenceSpaces,
  getConfluencePermissions,
  getBitbucketRepositories,
  getBitbucketPermissions,
};
