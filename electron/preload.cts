import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

type RoamState = {
  isRoaming: boolean;
  direction: "left" | "right";
  phase: "walking" | "resting" | "stopped";
};

const deskPet = {
  home: () => ipcRenderer.invoke("pet:home") as Promise<RoamState>,
  startRoaming: () => ipcRenderer.invoke("pet:start-roaming") as Promise<RoamState>,
  stopRoaming: () => ipcRenderer.invoke("pet:stop-roaming") as Promise<RoamState>,
  onRoamState: (callback: (state: RoamState) => void) => {
    const listener = (_event: IpcRendererEvent, state: RoamState) => callback(state);

    ipcRenderer.on("pet:roam-state", listener);
    return () => {
      ipcRenderer.removeListener("pet:roam-state", listener);
    };
  },
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.invoke("pet:toggle-ignore-mouse", ignore)
};

contextBridge.exposeInMainWorld("deskPet", deskPet);
