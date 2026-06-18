import gulp from "gulp";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveBin(name) {
  const executable = process.platform === "win32" ? `${name}.cmd` : name;
  return path.join(__dirname, "node_modules", ".bin", executable);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env,
      shell: isWindows,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${path.basename(command)} exited with code ${code ?? "unknown"}`,
        ),
      );
    });

    child.on("error", reject);
  });
}

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function removePaths(paths) {
  await Promise.all(
    paths.map(async (target) => {
      const absolutePath = path.join(__dirname, target);

      let stats;
      try {
        stats = await stat(absolutePath);
      } catch (error) {
        if (error?.code === "ENOENT") {
          return;
        }
        throw error;
      }

      await rm(absolutePath, {
        force: true,
        recursive: stats.isDirectory(),
        maxRetries: process.platform === "win32" ? 5 : 0,
        retryDelay: process.platform === "win32" ? 200 : 0,
      });
    }),
  );
}

async function readTauriConfig() {
  const configPath = path.join(__dirname, "src-tauri", "tauri.conf.json");
  const configContent = await readFile(configPath, "utf8");
  return JSON.parse(configContent);
}

async function readCargoPackageName() {
  const cargoTomlPath = path.join(__dirname, "src-tauri", "Cargo.toml");
  const cargoTomlContent = await readFile(cargoTomlPath, "utf8");
  const packageSection = cargoTomlContent.match(
    /^\[package\][\s\S]*?(?=^\[|\s*$)/m,
  )?.[0];
  const packageName = packageSection?.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  return packageName ?? null;
}

function getPlatformFolderName() {
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "macos";
  return "linux";
}

function getExecutableExtension() {
  if (process.platform === "win32") return ".exe";
  return "";
}

async function packageTauriExecutable() {
  const tauriConfig = await readTauriConfig();
  const executableExtension = getExecutableExtension();
  const productName = tauriConfig.productName ?? null;
  const cargoPackageName = await readCargoPackageName();
  const executableNames = [
    productName && `${productName}${executableExtension}`,
    cargoPackageName && `${cargoPackageName}${executableExtension}`,
  ].filter(Boolean);

  let executableName = null;
  let sourcePath = null;

  for (const candidate of executableNames) {
    const candidatePath = path.join(
      __dirname,
      "src-tauri",
      "target",
      "release",
      candidate,
    );

    if (await pathExists(candidatePath)) {
      executableName = candidate;
      sourcePath = candidatePath;
      break;
    }
  }

  if (!executableName || !sourcePath) {
    throw new Error(
      `Built executable not found in src-tauri/target/release (checked: ${executableNames.join(", ")})`,
    );
  }

  const platformFolder = path.join(
    __dirname,
    "package",
    getPlatformFolderName(),
  );
  const targetPath = path.join(platformFolder, executableName);

  await mkdir(platformFolder, { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
}

export function clean() {
  return removePaths(["dist", ".vite", "package"]);
}

export function build() {
  return runCommand(resolveBin("vite"), ["build"]);
}

export async function tauri() {
  await runCommand(resolveBin("tauri"), ["build"]);
  await packageTauriExecutable();
}

export function tauriDev() {
  return runCommand(resolveBin("tauri"), ["dev"]);
}

export function cleanAll() {
  return removePaths([
    "dist",
    ".vite",
    "package",
    "node_modules",
    "yarn.lock",
    "src-tauri/target",
  ]);
}

gulp.task("clean", clean);
gulp.task("cleanAll", cleanAll);
gulp.task("build", build);
gulp.task("tauri", tauri);
gulp.task("tauri:dev", tauriDev);

export default build;
