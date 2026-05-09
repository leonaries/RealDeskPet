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
let roamDirection: "left" | "right" = "left";

const windowSize = {
  width: 360,
  height: 340
};

const roam = {
  speed: 4,
  intervalMs: 32,
  margin: 8
};

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
    direction: roamDirection
  });
}

function stopRoaming() {
  if (!roamTimer) {
    sendRoamState(false);
    return;
  }

  clearInterval(roamTimer);
  roamTimer = null;
  sendRoamState(false);
}

function getCurrentWorkArea() {
  if (!mainWindow) {
    return screen.getPrimaryDisplay().workArea;
  }

  const [x, y] = mainWindow.getPosition();
  return screen.getDisplayNearestPoint({ x, y }).workArea;
}

function startRoaming() {
  if (!mainWindow) {
    return;
  }

  if (roamTimer) {
    stopRoaming();
    return;
  }

  sendRoamState(true);
  roamTimer = setInterval(() => {
    if (!mainWindow) {
      stopRoaming();
      return;
    }

    const area = getCurrentWorkArea();
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

    mainWindow.setPosition(Math.round(nextX), bounds.y, false);
  }, roam.intervalMs);
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
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });
  mainWindow.setAlwaysOnTop(true, "floating");

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
});

ipcMain.handle("pet:start-roaming", () => {
  startRoaming();
});

ipcMain.handle("pet:stop-roaming", () => {
  stopRoaming();
});

ipcMain.handle("pet:toggle-ignore-mouse", (_event, ignore: boolean) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});
