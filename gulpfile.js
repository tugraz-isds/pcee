import gulp from "gulp";
import { spawn } from "node:child_process";
import {cp, mkdir, readFile, readdir, rename, rm, stat} from "node:fs/promises";
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

async function readDirectoryEntriesSafe(directory) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
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

async function listArtifactCandidates(directory) {
  const entries = await readDirectoryEntriesSafe(directory);
  const candidates = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return [entryPath, ...(await listArtifactCandidates(entryPath))];
      }
      return [entryPath];
    }),
  );

  return candidates.flat();
}

async function findBuiltExecutable(releaseDirectory, executableNames) {
  const normalizedCandidates = [
    ...new Set(
      executableNames.flatMap((name) => {
        const lowered = name.toLowerCase();
        return lowered === name ? [name] : [name, lowered];
      }),
    ),
  ];

  for (const candidate of normalizedCandidates) {
    const candidatePath = path.join(releaseDirectory, candidate);
    if (await pathExists(candidatePath)) {
      return { executableName: candidate, executablePath: candidatePath };
    }
  }

  const releaseEntries = await readDirectoryEntriesSafe(releaseDirectory);
  const entryByLowerName = new Map(
    releaseEntries.map((entry) => [entry.name.toLowerCase(), entry]),
  );

  for (const candidate of normalizedCandidates) {
    const matchedEntry = entryByLowerName.get(candidate.toLowerCase());
    if (matchedEntry?.isFile()) {
      return {
        executableName: matchedEntry.name,
        executablePath: path.join(releaseDirectory, matchedEntry.name),
      };
    }
  }

  return null;
}

async function copyArtifacts(sourcePaths, targetDirectory) {
  await mkdir(targetDirectory, { recursive: true });
  return Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const targetPath = path.join(targetDirectory, path.basename(sourcePath));
      await cp(sourcePath, targetPath, { recursive: true });
      return { sourcePath, targetPath };
    }),
  );
}

function sanitizeNamePart(value) {
  return value.replace(/\s+/g, "-").toLowerCase();
}

function getReleaseBaseName(productName, version) {
  return `${sanitizeNamePart(productName)}-v${version}`;
}

function getRenamedArtifactFileName(filePath, executableName, releaseBaseName) {
  const normalizedPath = filePath.toLowerCase();
  const basename = path.basename(filePath);
  const extension = path.extname(filePath);

  if (basename.toLowerCase() === executableName.toLowerCase()) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}nsis${path.sep}`)) {
    return `${releaseBaseName}-setup${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}msi${path.sep}`)) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}dmg${path.sep}`)) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}macos${path.sep}`)) {
    return `${releaseBaseName}${extension}`;
  }

  if (
    normalizedPath.includes(`${path.sep}bundle${path.sep}appimage${path.sep}`)
  ) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}deb${path.sep}`)) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}rpm${path.sep}`)) {
    return `${releaseBaseName}${extension}`;
  }

  if (normalizedPath.includes(`${path.sep}bundle${path.sep}app${path.sep}`)) {
    const compressedExtension = basename.endsWith(".tar.gz")
      ? ".tar.gz"
      : extension;
    return `${releaseBaseName}${compressedExtension}`;
  }

  return basename;
}

async function renamePackagedArtifacts(
  copiedArtifacts,
  executableName,
  releaseBaseName,
) {
  await Promise.all(
    copiedArtifacts.map(async ({ sourcePath, targetPath }) => {
      const renamedFileName = getRenamedArtifactFileName(
        sourcePath,
        executableName,
        releaseBaseName,
      );
      const renamedTargetPath = path.join(
        path.dirname(targetPath),
        renamedFileName,
      );

      if (targetPath === renamedTargetPath) {
        return;
      }

      await rename(targetPath, renamedTargetPath);
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
  const appBasename = executableBasename.endsWith(".app")
    ? executableBasename
    : `${executableBasename}.app`;

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

function removeNestedArtifacts(artifactPaths) {
  const sortedPaths = [...artifactPaths].sort((left, right) => {
    const lengthDifference = left.length - right.length;
    if (lengthDifference !== 0) {
      return lengthDifference;
    }

    return left.localeCompare(right);
  });

  return sortedPaths.filter((currentPath, index) => {
    return !sortedPaths.slice(0, index).some((selectedPath) => {
      return (
        currentPath !== selectedPath &&
        currentPath.startsWith(`${selectedPath}${path.sep}`)
      );
    });
  });
}

function getTauriCliArgs() {
  const rawArgs = process.argv.slice(2);
  const args = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    const currentArg = rawArgs[index];

    if (!currentArg.startsWith("-")) {
      continue;
    }

    args.push(currentArg);

    const nextArg = rawArgs[index + 1];
    if (nextArg && !nextArg.startsWith("-")) {
      args.push(nextArg);
      index += 1;
    }
  }

  return args;
}

function getTauriTarget(cliArgs) {
  for (let index = 0; index < cliArgs.length; index += 1) {
    const currentArg = cliArgs[index];

    if (currentArg === "--target") {
      return cliArgs[index + 1] ?? null;
    }

    if (currentArg.startsWith("--target=")) {
      return currentArg.slice("--target=".length) || null;
    }
  }

  return null;
}

function getReleaseDirectory(targetTriple) {
  return targetTriple
    ? path.join(__dirname, "src-tauri", "target", targetTriple, "release")
    : path.join(__dirname, "src-tauri", "target", "release");
}

async function packageTauriArtifacts(targetTriple = null) {
  const tauriConfig = await readTauriConfig();
  const executableExtension = getExecutableExtension();
  const productName = tauriConfig.productName ?? null;
  const version = tauriConfig.version ?? null;
  const cargoPackageName = await readCargoPackageName();
  const executableNames = [
    productName && `${productName}${executableExtension}`,
    cargoPackageName && `${cargoPackageName}${executableExtension}`,
  ].filter(Boolean);

  if (!productName || !version) {
    throw new Error("Tauri productName and version are required for packaging.");
  }

  const releaseBaseName = getReleaseBaseName(productName, version);

  const releaseDirectory = getReleaseDirectory(targetTriple);
  const bundleDirectory = path.join(releaseDirectory, "bundle");
  const platformFolder = path.join(
    __dirname,
    "package",
    getPlatformFolderName(),
  );

  await removePaths([path.relative(__dirname, platformFolder)]);

  const builtExecutable = await findBuiltExecutable(
    releaseDirectory,
    executableNames,
  );

  if (!builtExecutable) {
    throw new Error(
      `Built executable not found in ${path.relative(__dirname, releaseDirectory)} (checked: ${executableNames.join(", ")})`,
    );
  }

  const { executableName, executablePath } = builtExecutable;

  const bundleFiles = (await pathExists(bundleDirectory))
    ? await listArtifactCandidates(bundleDirectory)
    : [];
  const matchesArtifact = getArtifactMatcher(executableName);
  const artifactPaths = removeNestedArtifacts(
    [executablePath, ...bundleFiles].filter(matchesArtifact),
  );

  if (artifactPaths.length === 0) {
    throw new Error(
      `No ${getPlatformFolderName()} Tauri artifacts found to package.`,
    );
  }

  const copiedArtifacts = await copyArtifacts(artifactPaths, platformFolder);
  await renamePackagedArtifacts(
    copiedArtifacts,
    executableName,
    releaseBaseName,
  );
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
  const tauriCliArgs = getTauriCliArgs();
  const tauriBuildArgs = ["build", ...tauriCliArgs];
  const targetTriple = getTauriTarget(tauriCliArgs);

  await runCommand(resolveBin("tauri"), tauriBuildArgs);
  await packageTauriArtifacts(targetTriple);
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
