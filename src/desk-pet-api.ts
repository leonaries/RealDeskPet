export type RoamState = { isRoaming: boolean; direction: "left" | "right" };

export type DeskPetApi = {
  home: () => Promise<RoamState>;
  startRoaming: () => Promise<RoamState>;
  stopRoaming: () => Promise<RoamState>;
  onRoamState: (callback: (state: RoamState) => void) => () => void;
  setIgnoreMouse: (ignore: boolean) => Promise<unknown>;
};
