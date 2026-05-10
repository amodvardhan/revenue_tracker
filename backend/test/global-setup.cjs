const { execSync } = require("child_process");
const path = require("path");

module.exports = async function globalSetup() {
  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env
  });
};
