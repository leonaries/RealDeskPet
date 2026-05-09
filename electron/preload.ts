import { contextBridge, ipcRenderer } from "electron";

const deskPet = {
  home: () => ipcRenderer.invoke("pet:home"),
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.invoke("pet:toggle-ignore-mouse", ignore)
};

contextBridge.exposeInMainWorld("deskPet", deskPet);

export type DeskPetApi = typeof deskPet;
