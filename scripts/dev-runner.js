const { spawn } = require("node:child_process");
const path = require("node:path");

function run(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      // Frontend uses this to call backend locally.
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
    },
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      // eslint-disable-next-line no-console
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");

const backend = run("backend", "npm", ["start"], backendDir);
const frontend = run("frontend", "npm", ["run", "dev"], frontendDir);

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
