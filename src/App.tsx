import { Bed, Cat, Footprints, Home, MessageCircle, Pause } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

type PetMood = "idle" | "walking" | "sitting" | "lying" | "meowing";

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
          className={`cat-body is-${mood} faces-${facing}`}
          aria-label="Drag Desk Cat"
          title="Drag Desk Cat"
          onDoubleClick={() => setMood("meowing")}
        >
          <span className="ear ear-left" />
          <span className="ear ear-right" />
          <span className="face">
            <span className="eye eye-left" />
            <span className="eye eye-right" />
            <span className="muzzle" />
          </span>
          <span className="tail" />
          <span className="paw paw-left" />
          <span className="paw paw-right" />
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
