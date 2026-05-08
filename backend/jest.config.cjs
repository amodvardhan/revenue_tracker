/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  clearMocks: true,
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.spec.ts"]
};
