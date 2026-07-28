import gulp from "gulp";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
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
  if (process.platform === "win32") return "win";
  if (process.platform === "darwin") return "macos";
  return "linux";
}

function getExecutableExtension() {
  if (process.platform === "win32") return ".exe";
  return "";
}

async function listFilesRecursive(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(entryPath);
      }
      return [entryPath];
    }),
  );

  return files.flat();
}

async function copyArtifacts(sourcePaths, targetDirectory) {
  await mkdir(targetDirectory, { recursive: true });
  await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const targetPath = path.join(targetDirectory, path.basename(sourcePath));
      await cp(sourcePath, targetPath, { recursive: true });
    }),
  );
}

function isWindowsInstallerArtifact(filePath, executableName) {
  const normalizedPath = filePath.toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  const executableBasename = executableName.toLowerCase();

  if (basename === executableBasename) {
    return true;
  }

  return (
    (normalizedPath.includes(`${path.sep}bundle${path.sep}nsis${path.sep}`) &&
      basename.endsWith(".exe")) ||
    (normalizedPath.includes(`${path.sep}bundle${path.sep}msi${path.sep}`) &&
      basename.endsWith(".msi"))
  );
}

function isMacOsInstallerArtifact(filePath, executableName) {
  const normalizedPath = filePath.toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  const executableBasename = executableName.toLowerCase();
  const appBasename = executableBasename.replace(/\.[^.]+$/, ".app");

  if (basename === executableBasename || basename === appBasename) {
    return true;
  }

  return (
    (normalizedPath.includes(`${path.sep}bundle${path.sep}dmg${path.sep}`) &&
      basename.endsWith(".dmg")) ||
    (normalizedPath.includes(`${path.sep}bundle${path.sep}macos${path.sep}`) &&
      basename.endsWith(".app"))
  );
}

function isLinuxInstallerArtifact(filePath, executableName) {
  const normalizedPath = filePath.toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  const executableBasename = executableName.toLowerCase();

  if (basename === executableBasename) {
    return true;
  }

  return (
    (normalizedPath.includes(
      `${path.sep}bundle${path.sep}appimage${path.sep}`,
    ) &&
      basename.endsWith(".appimage")) ||
    (normalizedPath.includes(`${path.sep}bundle${path.sep}deb${path.sep}`) &&
      basename.endsWith(".deb")) ||
    (normalizedPath.includes(`${path.sep}bundle${path.sep}rpm${path.sep}`) &&
      basename.endsWith(".rpm")) ||
    (normalizedPath.includes(`${path.sep}bundle${path.sep}app${path.sep}`) &&
      basename.endsWith(".tar.gz"))
  );
}

function getArtifactMatcher(executableName) {
  if (process.platform === "win32") {
    return (filePath) => isWindowsInstallerArtifact(filePath, executableName);
  }

  if (process.platform === "darwin") {
    return (filePath) => isMacOsInstallerArtifact(filePath, executableName);
  }

  return (filePath) => isLinuxInstallerArtifact(filePath, executableName);
}

async function packageTauriArtifacts() {
  const tauriConfig = await readTauriConfig();
  const executableExtension = getExecutableExtension();
  const productName = tauriConfig.productName ?? null;
  const cargoPackageName = await readCargoPackageName();
  const executableNames = [
    productName && `${productName}${executableExtension}`,
    cargoPackageName && `${cargoPackageName}${executableExtension}`,
  ].filter(Boolean);

  const releaseDirectory = path.join(
    __dirname,
    "src-tauri",
    "target",
    "release",
  );
  const bundleDirectory = path.join(releaseDirectory, "bundle");
  const platformFolder = path.join(
    __dirname,
    "package",
    getPlatformFolderName(),
  );

  await removePaths([path.relative(__dirname, platformFolder)]);

  let executableName = null;
  let executablePath = null;

  for (const candidate of executableNames) {
    const candidatePath = path.join(releaseDirectory, candidate);
    if (await pathExists(candidatePath)) {
      executableName = candidate;
      executablePath = candidatePath;
      break;
    }
  }

  if (!executableName || !executablePath) {
    throw new Error(
      `Built executable not found in src-tauri/target/release (checked: ${executableNames.join(", ")})`,
    );
  }

  const bundleFiles = (await pathExists(bundleDirectory))
    ? await listFilesRecursive(bundleDirectory)
    : [];
  const matchesArtifact = getArtifactMatcher(executableName);
  const artifactPaths = [executablePath, ...bundleFiles].filter(
    matchesArtifact,
  );

  if (artifactPaths.length === 0) {
    throw new Error(
      `No ${getPlatformFolderName()} Tauri artifacts found to package.`,
    );
  }

  await copyArtifacts(artifactPaths, platformFolder);
}

export function clean() {
  return removePaths(["dist", ".vite", "package"]);
}

export function cleanTauri() {
  return removePaths(["src-tauri/target"]);
}

export function build() {
  return runCommand(resolveBin("vite"), ["build"]);
}

export async function tauri() {
  await runCommand(resolveBin("tauri"), ["build"]);
  await packageTauriArtifacts();
}

export function cleanAll() {
  return removePaths([
    "dist",
    ".vite",
    "package",
    "node_modules",
    "src-tauri/target",
  ]);
}

gulp.task("clean", clean);
gulp.task("cleanTauri", cleanTauri);
gulp.task("cleanAll", cleanAll);
gulp.task("build", build);
gulp.task("tauri", tauri);

export default build;
