const fs = require("fs").promises;

async function isFolderExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false; // Path doesn't exist
    }
    throw err; // Other errors (like permission issues)
  }
}

module.exports = { isFolderExists };
