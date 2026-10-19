const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
let failed = false;
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(target);
    else if (entry.name.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", target], {
        stdio: "inherit",
      });
      if (result.status !== 0) failed = true;
    }
  }
}
visit("src");
visit("tests");
if (failed) process.exitCode = 1;
else console.log("Backend JavaScript syntax checks passed.");
