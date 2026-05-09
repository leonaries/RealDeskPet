/// <reference types="vite/client" />

import type { DeskPetApi } from "../electron/preload";

declare global {
  interface Window {
    deskPet?: DeskPetApi;
  }
}
