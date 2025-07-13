const Docker = require("dockerode");
const fs = require("fs");
const docker = new Docker();
const path = require("path");

async function runUserContainer(language, username, projectName) {
  const image = language === "python" ? "replit-python" : "replit-node";
  const safeUsername = sanitizeName(username);
  const safeProjectName = sanitizeName(projectName);
  const userFolder = path.join(
    __dirname,
    "..",
    "server/user_projects",
    safeUsername,
    safeProjectName
  );

  console.log(`userFolder: ${userFolder}`);

  if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });

  const container = await docker.createContainer({
    Image: image,
    name: `replit-${username}`,
    Tty: true,
    Cmd: ["/bin/bash"],
    HostConfig: {
      AutoRemove: true,
      Memory: 512 * 1024 * 1024,
      Binds: [`${userFolder}:/home/appuser`],
    },
  });

  await container.start();
  return container.id;
}

function sanitizeName(input) {
  return input.trim().replace(/[\/\\:*?"<>|]/g, ""); // Windows + Linux unsafe chars
}

module.exports = { runUserContainer };
