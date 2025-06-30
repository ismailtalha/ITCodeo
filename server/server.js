const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const pty = require("node-pty");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store active terminals for each socket
const terminals = {};
const workspaceDir = path.join(__dirname, "workspace");

// Ensure workspace directory exists
async function ensureWorkspace() {
  try {
    await fs.access(workspaceDir);
  } catch {
    await fs.mkdir(workspaceDir, { recursive: true });
  }
}

// Get file tree structure
async function getFileTree(dir, basePath = "") {
  const items = [];
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const children = await getFileTree(fullPath, relativePath);
        items.push({
          name: file,
          path: relativePath,
          type: "folder",
          children: children,
        });
      } else {
        items.push({
          name: file,
          path: relativePath,
          type: "file",
          size: stats.size,
        });
      }
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }

  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// API Routes
app.get("/api/files", async (req, res) => {
  try {
    const tree = await getFileTree(workspaceDir);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/file-content/:path(*)", async (req, res) => {
  try {
    const filePath = path.join(workspaceDir, req.params.path);
    const content = await fs.readFile(filePath, "utf8");
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: "File not found" });
  }
});

app.post("/api/save-file", async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(workspaceDir, filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf8");

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Create terminal
  socket.on("create-terminal", () => {
    const shell = process.platform === "win32" ? "powershell.exe" : "bash";
    const terminal = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd: workspaceDir,
      env: process.env,
    });

    terminals[socket.id] = terminal;

    // Send terminal data to client
    terminal.on("data", (data) => {
      socket.emit("terminal-output", data);
    });

    terminal.on("exit", () => {
      delete terminals[socket.id];
      socket.emit("terminal-exit");
    });

    socket.emit("terminal-created");
  });

  // Handle terminal input
  socket.on("terminal-input", (data) => {
    if (terminals[socket.id]) {
      terminals[socket.id].write(data);
    }
  });

  // Handle terminal resize
  socket.on("terminal-resize", ({ cols, rows }) => {
    if (terminals[socket.id]) {
      terminals[socket.id].resize(cols, rows);
    }
  });

  // Handle file operations
  socket.on("get-file-tree", async () => {
    try {
      const tree = await getFileTree(workspaceDir);
      socket.emit("file-tree", tree);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("get-file-content", async (filePath) => {
    try {
      const fullPath = path.join(workspaceDir, filePath);
      const content = await fs.readFile(fullPath, "utf8");
      socket.emit("file-content", { path: filePath, content });
    } catch (error) {
      socket.emit("error", `Error reading file: ${error.message}`);
    }
  });

  socket.on("save-file", async ({ path: filePath, content }) => {
    try {
      const fullPath = path.join(workspaceDir, filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");

      socket.emit("file-saved", filePath);

      // Broadcast file tree update to all clients
      const tree = await getFileTree(workspaceDir);
      io.emit("file-tree", tree);
    } catch (error) {
      socket.emit("error", `Error saving file: ${error.message}`);
    }
  });

  socket.on("create-file", async ({ path: filePath, content = "" }) => {
    try {
      const fullPath = path.join(workspaceDir, filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");

      socket.emit("file-created", filePath);

      // Broadcast file tree update
      const tree = await getFileTree(workspaceDir);
      io.emit("file-tree", tree);
    } catch (error) {
      socket.emit("error", `Error creating file: ${error.message}`);
    }
  });

  socket.on("create-folder", async (folderPath) => {
    try {
      const fullPath = path.join(workspaceDir, folderPath);
      await fs.mkdir(fullPath, { recursive: true });

      socket.emit("folder-created", folderPath);

      // Broadcast file tree update
      const tree = await getFileTree(workspaceDir);
      io.emit("file-tree", tree);
    } catch (error) {
      socket.emit("error", `Error creating folder: ${error.message}`);
    }
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (terminals[socket.id]) {
      terminals[socket.id].kill();
      delete terminals[socket.id];
    }
  });
});

// Initialize and start server
async function startServer() {
  await ensureWorkspace();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Workspace directory: ${workspaceDir}`);
  });
}

startServer().catch(console.error);
