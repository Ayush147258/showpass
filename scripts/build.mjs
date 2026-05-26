import { spawnSync } from "node:child_process";
import { join } from "node:path";

process.env.NEXT_PRIVATE_WORKER_THREADS = "false";

const run = (script, args) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(join("node_modules", "prisma", "build", "index.js"), ["generate"]);
run(join("node_modules", "next", "dist", "bin", "next"), ["build"]);
