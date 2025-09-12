module.exports = {
  // The test environment that will be used for testing
  testEnvironment: "node",

  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/src"],

  // The file extensions your modules use
  moduleFileExtensions: ["js", "json", "node"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // An array of regexp pattern strings that are matched against all source file paths before transformation
  transformIgnorePatterns: [
    "/node_modules/(?!(@slack|axios)/)", // Transform @slack/web-api and axios
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
