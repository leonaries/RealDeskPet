import type electron from "electron";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, screen } =
  require("electron") as typeof electron;

let mainWindow: electron.BrowserWindow | null = null;

const windowSize = {
  width: 360,
  height: 340
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
  mainWindow?.setBounds(getHomeBounds(), true);
});

ipcMain.handle("pet:toggle-ignore-mouse", (_event, ignore: boolean) => {
  mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
});
