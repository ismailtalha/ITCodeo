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
  if (language === "node") {
    await execInContainer(container, ["npm", "init", "-y"]);
    await execInContainer(container, [
      "sh",
      "-c",
      'echo "console.log(\\"Hello from Node.js\\")" > index.js',
    ]);
  }
  return container.id;
}

function sanitizeName(input) {
  return input.trim().replace(/[\/\\:*?"<>|]/g, ""); // Windows + Linux unsafe chars
}

async function execInContainer(container, cmdArray, workdir = "/home/appuser") {
  const exec = await container.exec({
    Cmd: cmdArray,
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: workdir,
  });

  const stream = await exec.start({});

  return new Promise((resolve, reject) => {
    let output = "";
    stream.on("data", (chunk) => {
      output += chunk.toString();
    });

    stream.on("end", () => {
      resolve(output.trim());
    });

    stream.on("error", reject);
  });
}

module.exports = { runUserContainer };
