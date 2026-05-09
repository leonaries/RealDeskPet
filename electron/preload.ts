import { contextBridge, ipcRenderer } from "electron";

const deskPet = {
  home: () => ipcRenderer.invoke("pet:home"),
  startRoaming: () => ipcRenderer.invoke("pet:start-roaming"),
  stopRoaming: () => ipcRenderer.invoke("pet:stop-roaming"),
  onRoamState: (
    callback: (state: { isRoaming: boolean; direction: "left" | "right" }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      state: { isRoaming: boolean; direction: "left" | "right" }
    ) => callback(state);

    ipcRenderer.on("pet:roam-state", listener);
    return () => {
      ipcRenderer.removeListener("pet:roam-state", listener);
    };
  },
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.invoke("pet:toggle-ignore-mouse", ignore)
};

contextBridge.exposeInMainWorld("deskPet", deskPet);

export type DeskPetApi = typeof deskPet;
