const express = require("express");
const httpServer = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const chokidar = require("chokidar");
const { VM } = require("vm2");

const app = express();
const server = httpServer.createServer(app);
let buffer = "";
let flushTimeout = null;

app.use(express.json());

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "**", // allow CORS for Postman
  },
});

chokidar.watch("./user").on("all", (event, path) => {
  console.log(`File ${path} has been ${event}`);
  // You can emit an event to the client if needed
  io.emit("file-changed", { event, path });
});

var shell = "powershell.exe";

var ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD + "./user_projects",
  env: process.env,
});

ptyProcess.onData((data) => {
  buffer += data;

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      const filtered = filterOutput(buffer);
      console.log(filtered);
      io.emit("terminal-data", filtered);
      buffer = "";
      flushTimeout = null;
    }, 20); // adjust this (10–30ms) as needed
  }
});

function filterOutput(output) {
  const lines = output.split(/\r?\n/);

  return lines
    .filter(
      (line) =>
        !line.trim().startsWith(">>") && // Hide '>>'
        !line.trim().startsWith("Mode") && // Hide table headers
        !line.trim().startsWith("----") && // Hide table separators
        line.trim() !== "" // Remove empty lines
    )
    .join("\r\n");
}

io.on("connection", (socket) => {
  socket.on("terminal-write", (data) => {
    console.log("terminal-write:", data);
    ptyProcess.write(data);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO Server is running.");
});

app.get("/getFiles", async (req, res) => {
  let trees = await getFileTree("./user");
  res.send(trees);
});

app.get("/getFileContent", async (req, res) => {
  let filePath = path.join(__dirname, "user", req.query.filePath);
  let fileContent = await getFileContent(filePath);
  res.send({ data: fileContent });
});

app.post("/setFileContent", async (req, res) => {
  let fileContent = req.body.content;
  let filePath = path.join(__dirname, "user", req.body.filePath);
  // Ensure the directory exists
  await fs.writeFile(filePath, fileContent, "utf8");
  // let result = runCode(fileContent);
  res.send({ code: 200, msg: "File saved successfully" });
});

app.post("/createCompiler", async (req, res) => {
  let language = req.body.language;
  let indexjsfilePath = path.join(__dirname, "user", "index.js");
  // Ensure the directory exists
  await fs.writeFile(indexjsfilePath, "", "utf8");
  res.send({ code: 200, msg: "Compiler created successfully" });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

async function getFileTree(dir) {
  const tree = [];
  async function buildTree(currentDir, currentTree) {
    const files = await fs.readdir(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        let obj = { name: file, children: [] };
        currentTree.push(obj);
        let index = currentTree.findIndex((item) => item.name === file);
        if (index === -1) {
          return;
        }
        await buildTree(filePath, currentTree[index].children);
      } else {
        currentTree.push({ name: file, children: [] });
      }
    }
  }

  await buildTree(dir, tree);
  return tree;
}

async function getFileContent(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return { code: 200, data: content };
  } catch (error) {
    return { code: 404, error: error };
  }
}

function runCode(code) {
  let output = "";
  const vm = new VM({
    timeout: 1000,
    sandbox: {
      console: {
        log: (...args) => {
          output += args.join(" ") + "\n";
        },
        error: (...args) => {
          output += "[Error] " + args.join(" ") + "\n";
        },
      },
      alert: (msg) => {
        output += "[Alert] " + msg + "\n";
      },
    },
  });

  try {
    vm.run(code);
    return output;
  } catch (err) {
    output += "Runtime Error: " + err.message;
  }
}
