const {defaults} = require('jest-config');
module.exports = {
    preset: "jest-puppeteer",
    globals: {
		
    },
    testMatch: [
      "**/test/**/*.test.js"
    ],
    verbose: true,
  setupFilesAfterEnv: ["./jest.setup.js"],
  collectCoverage: false,
  collectCoverageFrom: ["./dist/rafx.js"],
  coverageDirectory: "./src/coverage"
}