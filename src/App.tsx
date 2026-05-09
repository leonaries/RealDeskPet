import { Bed, Cat, Footprints, Home, MessageCircle, Pause } from "lucide-react";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type PetMood = "idle" | "walking" | "sitting" | "lying" | "meowing";
type SpriteState =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

const spriteMeta: Record<SpriteState, { row: number; frames: number; fps: number }> = {
  idle: { row: 0, frames: 6, fps: 4 },
  "running-right": { row: 1, frames: 8, fps: 10 },
  "running-left": { row: 2, frames: 8, fps: 10 },
  waving: { row: 3, frames: 4, fps: 6 },
  jumping: { row: 4, frames: 5, fps: 8 },
  failed: { row: 5, frames: 8, fps: 8 },
  waiting: { row: 6, frames: 6, fps: 5 },
  running: { row: 7, frames: 6, fps: 6 },
  review: { row: 8, frames: 6, fps: 5 }
};

const moodToSprite: Record<PetMood, SpriteState> = {
  idle: "idle",
  walking: "running-left",
  sitting: "idle",
  lying: "waiting",
  meowing: "waving"
};

const actions: Array<{
  mood: PetMood;
  label: string;
  icon: typeof Cat;
}> = [
  { mood: "walking", label: "Walk", icon: Footprints },
  { mood: "sitting", label: "Sit", icon: Pause },
  { mood: "lying", label: "Lie", icon: Bed },
  { mood: "meowing", label: "Meow", icon: MessageCircle }
];

function App() {
  const [mood, setMood] = useState<PetMood>("idle");
  const [facing, setFacing] = useState<"left" | "right">("left");
  const [frame, setFrame] = useState(0);
  const [isRoaming, setIsRoaming] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const hideMenuTimer = useRef<number | null>(null);

  const spriteState = mood === "walking" && facing === "right" ? "running-right" : moodToSprite[mood];
  const currentSprite = spriteMeta[spriteState];
  const applyRoamState = (state: { isRoaming: boolean; direction: "left" | "right" }) => {
    setIsRoaming(state.isRoaming);
    setFacing(state.direction);
    setMood(state.isRoaming ? "walking" : "idle");
  };

  useEffect(() => {
    if (mood !== "meowing") {
      return;
    }

    const timer = window.setTimeout(() => setMood("idle"), 1300);
    return () => window.clearTimeout(timer);
  }, [mood]);

  useEffect(() => window.deskPet?.onRoamState(applyRoamState), []);

  useEffect(() => {
    setFrame(0);
  }, [spriteState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % currentSprite.frames);
    }, 1000 / currentSprite.fps);

    return () => window.clearInterval(timer);
  }, [currentSprite.fps, currentSprite.frames]);

  useEffect(() => () => {
    if (hideMenuTimer.current) {
      window.clearTimeout(hideMenuTimer.current);
    }
  }, []);

  const speech = useMemo(() => {
    if (mood === "meowing") {
      return "miao";
    }
    if (mood === "walking") {
      return "pat pat";
    }
    return "";
  }, [mood]);

  const goHome = async () => {
    const state = await window.deskPet?.home();
    applyRoamState(state ?? { isRoaming: false, direction: facing });
  };

  const handleAction = async (nextMood: PetMood) => {
    if (nextMood === "walking") {
      console.debug("[desk-pet] walk button clicked", { isRoaming });
      if (isRoaming) {
        const state = await window.deskPet?.stopRoaming();
        applyRoamState(state ?? { isRoaming: false, direction: facing });
        return;
      }

      const state = await window.deskPet?.startRoaming();
      applyRoamState(state ?? { isRoaming: false, direction: facing });
      return;
    }

    const state = await window.deskPet?.stopRoaming();
    setIsRoaming(state?.isRoaming ?? false);
    if (state?.direction) {
      setFacing(state.direction);
    }
    setMood(nextMood);
  };

  const handleActionPointer = (event: PointerEvent<HTMLButtonElement>, nextMood: PetMood) => {
    event.preventDefault();
    event.stopPropagation();
    void handleAction(nextMood);
  };

  const handleHomePointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void goHome();
  };

  const showMenu = () => {
    if (hideMenuTimer.current) {
      window.clearTimeout(hideMenuTimer.current);
      hideMenuTimer.current = null;
    }
    setIsMenuVisible(true);
  };

  const scheduleHideMenu = () => {
    if (hideMenuTimer.current) {
      window.clearTimeout(hideMenuTimer.current);
    }
    hideMenuTimer.current = window.setTimeout(() => {
      setIsMenuVisible(false);
      hideMenuTimer.current = null;
    }, 1000);
  };

  return (
    <main className="stage" onPointerEnter={showMenu} onPointerLeave={scheduleHideMenu}>
      <section className="pet-zone" aria-label="Desk cat">
        {speech && <div className="bubble">{speech}</div>}
        <button
          className={`cat-sprite is-${mood}`}
          aria-label="Drag Desk Cat"
          title="Drag Desk Cat"
          onDoubleClick={() => setMood("meowing")}
          style={{
            "--sprite-row": currentSprite.row,
            "--sprite-frame": frame
          } as React.CSSProperties}
        >
          <span className="sr-only">Dudu</span>
        </button>
      </section>

      <nav className={`toolbar ${isMenuVisible ? "is-visible" : ""}`} aria-label="Pet actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mood}
              className={mood === action.mood ? "active" : ""}
              type="button"
              title={action.label}
              aria-label={action.label}
              onPointerDown={(event) => handleActionPointer(event, action.mood)}
            >
              <Icon size={18} strokeWidth={2.4} />
            </button>
          );
        })}
        <button type="button" title="Home" aria-label="Home" onPointerDown={handleHomePointer}>
          <Home size={18} strokeWidth={2.4} />
        </button>
      </nav>
    </main>
  );
}

export default App;
