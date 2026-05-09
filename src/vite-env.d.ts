/// <reference types="vite/client" />

import type { DeskPetApi } from "./desk-pet-api";

declare global {
  interface Window {
    deskPet?: DeskPetApi;
  }
}
