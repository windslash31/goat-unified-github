if (process.env.NODE_ENV !== "production") {
  require("./loadEnv");
}

module.exports = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL,
  db: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  cookie: {
    secret: process.env.COOKIE_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    customerId: process.env.GOOGLE_CUSTOMER_ID,
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
  },
  jumpcloud: {
    apiKey: process.env.JUMPCLOUD_API_KEY,
  },
  atlassian: {
    apiToken: process.env.ATLASSIAN_API_TOKEN,
    apiUser: process.env.ATLASSIAN_API_USER,
    domain: process.env.ATLASSIAN_DOMAIN,
    workspaceId: process.env.ATLASSIAN_WORKSPACE_ID,
  },
  nodeEnv: process.env.NODE_ENV || "development",
};
