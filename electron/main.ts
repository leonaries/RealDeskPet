import type electron from "electron";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, screen } =
  require("electron") as typeof electron;

let mainWindow: electron.BrowserWindow | null = null;
let roamTimer: NodeJS.Timeout | null = null;
let roamPhaseTimer: NodeJS.Timeout | null = null;
let roamDirection: "left" | "right" = "left";
let roamPhase: "walking" | "resting" | "stopped" = "stopped";

const windowSize = {
  width: 360,
  height: 340
};

const roam = {
  speed: 4,
  intervalMs: 32,
  margin: 8,
  debugEverySteps: 45,
  minWalkMs: 9000,
  maxWalkMs: 16000,
  minRestMs: 3500,
  maxRestMs: 7500
};

let roamStepCount = 0;

function getHomeBounds() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;

  return {
    x: Math.round(area.x + area.width - windowSize.width - 26),
    y: Math.round(area.y + area.height - windowSize.height - 22),
    width: windowSize.width,
    height: windowSize.height
  };
}

function sendRoamState(isRoaming: boolean) {
  mainWindow?.webContents.send("pet:roam-state", {
    isRoaming,
    direction: roamDirection,
    phase: roamPhase
  });
}

function stopRoaming() {
  roamPhase = "stopped";
  if (roamPhaseTimer) {
    clearTimeout(roamPhaseTimer);
    roamPhaseTimer = null;
  }

  if (!roamTimer) {
    sendRoamState(false);
    return { isRoaming: false, direction: roamDirection, phase: roamPhase };
  }

  clearInterval(roamTimer);
  roamTimer = null;
  sendRoamState(false);
  return { isRoaming: false, direction: roamDirection, phase: roamPhase };
}

function stepRoam() {
  if (!mainWindow) {
    return { isRoaming: false, direction: roamDirection, phase: roamPhase };
  }

  if (roamPhase !== "walking") {
    return { isRoaming: true, direction: roamDirection, phase: roamPhase };
  }

  const area = screen.getPrimaryDisplay().workArea;
  const bounds = mainWindow.getBounds();
  let nextX = bounds.x + (roamDirection === "right" ? roam.speed : -roam.speed);
  const minX = area.x + roam.margin;
  const maxX = area.x + area.width - bounds.width - roam.margin;

  if (nextX <= minX) {
    nextX = minX;
    roamDirection = "right";
    sendRoamState(true);
  }

  if (nextX >= maxX) {
    nextX = maxX;
    roamDirection = "left";
    sendRoamState(true);
  }

  mainWindow.setBounds({ ...bounds, x: Math.round(nextX) }, false);
  roamStepCount += 1;
  if (process.env.VITE_DEV_SERVER_URL && roamStepCount % roam.debugEverySteps === 1) {
    console.log(`[desk-pet] roaming ${bounds.x},${bounds.y} -> ${Math.round(nextX)},${bounds.y}`);
  }
  return { isRoaming: true, direction: roamDirection, phase: roamPhase };
}

function randomDuration(minMs: number, maxMs: number) {
  return Math.round(minMs + Math.random() * (maxMs - minMs));
}

function scheduleRoamPhase() {
  if (roamPhaseTimer) {
    clearTimeout(roamPhaseTimer);
  }

  const duration =
    roamPhase === "walking"
      ? randomDuration(roam.minWalkMs, roam.maxWalkMs)
      : randomDuration(roam.minRestMs, roam.maxRestMs);

  roamPhaseTimer = setTimeout(() => {
    roamPhase = roamPhase === "walking" ? "resting" : "walking";
    sendRoamState(true);
    scheduleRoamPhase();
  }, duration);
}

function startRoaming() {
  if (!mainWindow) {
    return { isRoaming: false, direction: roamDirection, phase: roamPhase };
  }

  if (roamTimer) {
    return { isRoaming: true, direction: roamDirection, phase: roamPhase };
  }

  roamPhase = "walking";
  stepRoam();
  sendRoamState(true);
  scheduleRoamPhase();
  roamTimer = setInterval(() => {
    stepRoam();
  }, roam.intervalMs);
  return { isRoaming: true, direction: roamDirection, phase: roamPhase };
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    ...getHomeBounds(),
    title: "Real Desk Pet",
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    backgroundColor: "#00000000",
    trafficLightPosition: { x: -100, y: -100 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });
  mainWindow.setAlwaysOnTop(true, "floating");

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.on("console-message", (_event, _level, message) => {
      console.log(`[renderer] ${message}`);
    });
    mainWindow.webContents.once("did-finish-load", async () => {
      const hasDeskPet = await mainWindow?.webContents.executeJavaScript(
        "Boolean(window.deskPet && window.deskPet.startRoaming)"
      );
      console.log(`[desk-pet] preload bridge ready: ${hasDeskPet}`);
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("pet:home", () => {
  stopRoaming();
  mainWindow?.setBounds(getHomeBounds(), true);
  return { isRoaming: false, direction: roamDirection, phase: roamPhase };
});

ipcMain.handle("pet:start-roaming", () => {
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("[desk-pet] start-roaming requested");
  }
  return startRoaming();
});

ipcMain.handle("pet:stop-roaming", () => {
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log("[desk-pet] stop-roaming requested");
  }
  return stopRoaming();
});

ipcMain.handle("pet:toggle-ignore-mouse", (_event, ignore: boolean) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});
