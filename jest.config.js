module.exports = {
  testEnvironment: "jsdom",
  transform: {
      "^.+\\.jsx?$": "babel-jest",
  },
  transformIgnorePatterns: [
      "/node_modules/(?!cross-fetch|whatwg-fetch)/",
  ],
  moduleNameMapper: {
      "\\.(css|scss)$": "identity-obj-proxy",
      "\\.(svg|jpg|png)$": "<rootDir>/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleDirectories: ["node_modules", "src"],
};
