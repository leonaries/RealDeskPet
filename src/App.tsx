import { Bed, Cat, Footprints, Home, MessageCircle, Pause } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  sitting: "waiting",
  lying: "review",
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

  const spriteState = mood === "walking" && facing === "right" ? "running-right" : moodToSprite[mood];
  const currentSprite = spriteMeta[spriteState];

  useEffect(() => {
    if (mood !== "meowing") {
      return;
    }

    const timer = window.setTimeout(() => setMood("idle"), 1300);
    return () => window.clearTimeout(timer);
  }, [mood]);

  useEffect(() => {
    if (mood !== "walking") {
      return;
    }

    const timer = window.setInterval(() => {
      setFacing((current) => (current === "left" ? "right" : "left"));
    }, 2200);

    return () => window.clearInterval(timer);
  }, [mood]);

  useEffect(() => {
    setFrame(0);
  }, [spriteState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % currentSprite.frames);
    }, 1000 / currentSprite.fps);

    return () => window.clearInterval(timer);
  }, [currentSprite.fps, currentSprite.frames]);

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
    await window.deskPet?.home();
    setMood("idle");
  };

  return (
    <main className="stage">
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

      <nav className="toolbar" aria-label="Pet actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mood}
              className={mood === action.mood ? "active" : ""}
              type="button"
              title={action.label}
              aria-label={action.label}
              onClick={() => setMood(action.mood)}
            >
              <Icon size={18} strokeWidth={2.4} />
            </button>
          );
        })}
        <button type="button" title="Home" aria-label="Home" onClick={goHome}>
          <Home size={18} strokeWidth={2.4} />
        </button>
      </nav>
    </main>
  );
}

export default App;
