"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Clef = "treble" | "bass";
type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";
type PracticeMode = "both" | Clef;

type Note = {
  letter: Letter;
  octave: number;
  clef: Clef;
};

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

const NOTE_POOL: Note[] = [
  { letter: "C", octave: 4, clef: "treble" },
  { letter: "D", octave: 4, clef: "treble" },
  { letter: "E", octave: 4, clef: "treble" },
  { letter: "F", octave: 4, clef: "treble" },
  { letter: "G", octave: 4, clef: "treble" },
  { letter: "A", octave: 4, clef: "treble" },
  { letter: "B", octave: 4, clef: "treble" },
  { letter: "C", octave: 5, clef: "treble" },
  { letter: "D", octave: 5, clef: "treble" },
  { letter: "E", octave: 5, clef: "treble" },
  { letter: "F", octave: 5, clef: "treble" },
  { letter: "G", octave: 5, clef: "treble" },
  { letter: "A", octave: 5, clef: "treble" },
  { letter: "B", octave: 5, clef: "treble" },
  { letter: "C", octave: 2, clef: "bass" },
  { letter: "D", octave: 2, clef: "bass" },
  { letter: "E", octave: 2, clef: "bass" },
  { letter: "F", octave: 2, clef: "bass" },
  { letter: "G", octave: 2, clef: "bass" },
  { letter: "A", octave: 2, clef: "bass" },
  { letter: "B", octave: 2, clef: "bass" },
  { letter: "C", octave: 3, clef: "bass" },
  { letter: "D", octave: 3, clef: "bass" },
  { letter: "E", octave: 3, clef: "bass" },
  { letter: "F", octave: 3, clef: "bass" },
  { letter: "G", octave: 3, clef: "bass" },
  { letter: "A", octave: 3, clef: "bass" },
  { letter: "B", octave: 3, clef: "bass" },
  { letter: "C", octave: 4, clef: "bass" }
];

const STAFF_TOP = 88;
const STAFF_LEFT = 95;
const STAFF_RIGHT = 505;
const LINE_GAP = 18;
const NOTE_X = 300;
const BEST_KEY = "note-reader-best-streak";
const THEME_KEY = "note-reader-theme";
const PIANO_MP3_BASE_URL = "https://raw.githubusercontent.com/fuhton/piano-mp3/master/piano-mp3";

function notesForMode(mode: PracticeMode) {
  if (mode === "both") {
    return NOTE_POOL;
  }

  return NOTE_POOL.filter((note) => note.clef === mode);
}

function randomNote(pool: Note[], previous?: Note) {
  let next = pool[Math.floor(Math.random() * pool.length)];

  if (previous && pool.length > 1) {
    while (
      next.letter === previous.letter &&
      next.octave === previous.octave &&
      next.clef === previous.clef
    ) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return next;
}

function diatonicIndex(note: Pick<Note, "letter" | "octave">) {
  return note.octave * 7 + LETTERS.indexOf(note.letter);
}

function noteName(note: Pick<Note, "letter" | "octave">) {
  return `${note.letter}${note.octave}`;
}

function audioUrl(note: Pick<Note, "letter" | "octave">) {
  return `${PIANO_MP3_BASE_URL}/${noteName(note)}.mp3`;
}

function noteY(note: Note) {
  const bottomLine = STAFF_TOP + LINE_GAP * 4;
  const reference =
    note.clef === "treble"
      ? diatonicIndex({ letter: "E", octave: 4 })
      : diatonicIndex({ letter: "G", octave: 2 });

  return bottomLine - (diatonicIndex(note) - reference) * (LINE_GAP / 2);
}

function ledgerLines(y: number) {
  const lines: number[] = [];
  const bottom = STAFF_TOP + LINE_GAP * 4;
  const top = STAFF_TOP;
  const halfGap = LINE_GAP / 2;

  if (y > bottom) {
    for (let lineY = bottom + LINE_GAP; lineY <= y + halfGap; lineY += LINE_GAP) {
      lines.push(lineY);
    }
  }

  if (y < top) {
    for (let lineY = top - LINE_GAP; lineY >= y - halfGap; lineY -= LINE_GAP) {
      lines.push(lineY);
    }
  }

  return lines;
}

function ClefGlyph({ clef }: { clef: Clef }) {
  if (clef === "treble") {
    return (
      <text x="92" y="155" className="clef treble-clef" aria-hidden="true">
        𝄞
      </text>
    );
  }

  return (
    <text x="92" y="125" className="clef bass-clef" aria-hidden="true">
      𝄢
    </text>
  );
}

function NoteStaff({
  note,
  onPlay,
  audioStatus
}: {
  note: Note;
  onPlay: () => void;
  audioStatus: string;
}) {
  const y = noteY(note);
  const stemUp = y >= STAFF_TOP + LINE_GAP * 2;
  const stemX = stemUp ? NOTE_X + 13 : NOTE_X - 13;
  const stemEndY = stemUp ? y - 58 : y + 58;

  return (
    <figure className="staff-card" aria-label={`${note.clef} clef note flash card`}>
      <svg className="staff" viewBox="0 0 600 260" role="img" aria-label={`${note.clef} clef note`}>
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1={STAFF_LEFT}
            x2={STAFF_RIGHT}
            y1={STAFF_TOP + line * LINE_GAP}
            y2={STAFF_TOP + line * LINE_GAP}
            className="staff-line"
          />
        ))}
        <ClefGlyph clef={note.clef} />
        {ledgerLines(y).map((lineY) => (
          <line
            key={lineY}
            x1={NOTE_X - 29}
            x2={NOTE_X + 29}
            y1={lineY}
            y2={lineY}
            className="staff-line ledger-line"
          />
        ))}
        <ellipse
          cx={NOTE_X}
          cy={y}
          rx="15"
          ry="10"
          transform={`rotate(-18 ${NOTE_X} ${y})`}
          className="note-head"
        />
        <line x1={stemX} x2={stemX} y1={y} y2={stemEndY} className="note-stem" />
      </svg>
      <figcaption>
        <span>{note.clef === "treble" ? "Treble Clef" : "Bass Clef"}</span>
        <button className="play-note-button" type="button" onClick={onPlay} aria-label="Play this note">
          Play
        </button>
        <span className="audio-status" aria-live="polite">
          {audioStatus}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const [note, setNote] = useState<Note>(NOTE_POOL[0]);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [theme, setTheme] = useState<"light" | "dim">("light");
  const [mode, setMode] = useState<PracticeMode>("both");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notePool = useMemo(() => notesForMode(mode), [mode]);

  useEffect(() => {
    const storedBest = window.localStorage.getItem(BEST_KEY);
    const storedTheme = window.localStorage.getItem(THEME_KEY);

    if (storedBest) {
      setBest(Number(storedBest));
    }

    if (storedTheme === "dim") {
      setTheme("dim");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setAudioStatus("");
  }, [note]);

  const accuracy = useMemo(() => {
    if (attempts === 0) {
      return 100;
    }

    return Math.round((correct / attempts) * 100);
  }, [attempts, correct]);

  const progress = Math.min(100, (streak / 12) * 100);

  const goNext = useCallback(() => {
    setNote((current) => randomNote(notePool, current));
    setSelected(null);
    setIsAnswered(false);
  }, [notePool]);

  useEffect(() => {
    setNote((current) => randomNote(notePool, current));
    setSelected(null);
    setIsAnswered(false);
  }, [notePool]);

  const answer = useCallback(
    (letter: Letter) => {
      if (isAnswered) {
        return;
      }

      const wasCorrect = letter === note.letter;
      const nextStreak = wasCorrect ? streak + 1 : 0;

      setSelected(letter);
      setIsAnswered(true);
      setAttempts((value) => value + 1);
      setCorrect((value) => value + (wasCorrect ? 1 : 0));
      setStreak(nextStreak);

      if (nextStreak > best) {
        setBest(nextStreak);
        window.localStorage.setItem(BEST_KEY, String(nextStreak));
      }
    },
    [best, isAnswered, note.letter, streak]
  );

  const reset = useCallback(() => {
    setAttempts(0);
    setCorrect(0);
    setStreak(0);
    setSelected(null);
    setIsAnswered(false);
    setNote((current) => randomNote(notePool, current));
  }, [notePool]);

  const playCurrentNote = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioUrl(note));
    audioRef.current = audio;
    setAudioStatus("Playing");

    audio
      .play()
      .then(() => {
        audio.onended = () => setAudioStatus("");
      })
      .catch(() => {
        setAudioStatus("Sound unavailable");
      });
  }, [note]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toUpperCase();

      if (LETTERS.includes(key as Letter)) {
        answer(key as Letter);
      }

      if ((event.key === " " || event.key === "Enter") && isAnswered) {
        event.preventDefault();
        goNext();
      }

      if (event.key.toLowerCase() === "p") {
        playCurrentNote();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, goNext, isAnswered, playCurrentNote]);

  const scoreLabel = `${correct}/${attempts}`;
  const feedback =
    selected === null
      ? "Name this note (or press the letter key)"
      : selected === note.letter
        ? "Correct. Press Space or Enter for the next note."
        : `That was ${note.letter}. Press Space or Enter for the next note.`;

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand" aria-label="Note Reader">
          <span className="brand-mark" aria-hidden="true">
            ♪
          </span>
          <span>Note Reader</span>
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Practice settings"
            aria-expanded={isSettingsOpen}
            onClick={() => setIsSettingsOpen((value) => !value)}
          >
            ⚙
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle dim mode"
            onClick={() => setTheme((value) => (value === "light" ? "dim" : "light"))}
          >
            ☾
          </button>
        </div>
      </header>

      <section className="practice" aria-label="Music note flash cards">
        {isSettingsOpen ? (
          <div className="settings-panel" aria-label="Practice settings">
            <span>Practice</span>
            {(["both", "treble", "bass"] as PracticeMode[]).map((choice) => (
              <button
                key={choice}
                className={choice === mode ? "setting-choice active" : "setting-choice"}
                type="button"
                onClick={() => setMode(choice)}
              >
                {choice === "both" ? "Both" : choice === "treble" ? "Treble" : "Bass"}
              </button>
            ))}
          </div>
        ) : null}

        <div className="stats-row">
          <div className="stat">
            <span>Score</span>
            <strong>{scoreLabel}</strong>
          </div>
          <div className="stat">
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
          <div className="stat">
            <span>Streak</span>
            <strong className={streak > 0 ? "pill active" : "pill"}>{streak}</strong>
          </div>
          <div className="stat">
            <span>Best</span>
            <strong>{best}</strong>
          </div>
          <button className="reset-button" type="button" onClick={reset}>
            <span aria-hidden="true">↻</span>
            Reset
          </button>
        </div>

        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${Math.max(7, progress)}%` }} />
        </div>

        <NoteStaff note={note} onPlay={playCurrentNote} audioStatus={audioStatus} />

        <div className="answer-panel">
          <p className={selected === null ? "prompt" : selected === note.letter ? "prompt correct" : "prompt wrong"}>
            {feedback}
          </p>
          <div className="answer-grid" role="group" aria-label="Answer choices">
            {LETTERS.map((letter) => {
              const isCorrect = isAnswered && letter === note.letter;
              const isWrong = isAnswered && selected === letter && selected !== note.letter;

              return (
                <button
                  key={letter}
                  className={`answer-button${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}`}
                  type="button"
                  onClick={() => answer(letter)}
                  disabled={isAnswered}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          <p className="keyboard-hint">Keyboard: press C D E F G A B to answer · P to hear the note · Space or Enter for next</p>
        </div>
      </section>
    </main>
  );
}
