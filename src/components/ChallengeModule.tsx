import { useState, useEffect, useCallback } from "react";
import { skills, loadProgress, saveProgress, type Skill, type SkillProgress } from "../config/challenges";

type View = "grid" | "intro" | "quiz" | "result";

export default function ChallengeModule() {
  const [view, setView] = useState<View>("grid");
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<string, SkillProgress>>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const totalXP = Object.entries(progress).reduce((sum, [id, p]) => {
    if (!p.completed) return sum;
    const skill = skills.find((s) => s.id === id);
    return sum + (skill?.xpReward ?? 0);
  }, 0);
  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  const openSkill = useCallback((skill: Skill) => {
    setActiveSkill(skill);
    setView("intro");
  }, []);

  const startQuiz = useCallback(() => {
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setView("quiz");
  }, []);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null || !activeSkill) return;
      setSelected(idx);
      if (idx === activeSkill.questions[currentQ].correctIndex) {
        setScore((s) => s + 1);
      }
    },
    [selected, activeSkill, currentQ],
  );

  const nextQuestion = useCallback(() => {
    if (!activeSkill) return;
    if (currentQ + 1 >= activeSkill.questions.length) {
      const finalScore = selected === activeSkill.questions[currentQ].correctIndex ? score : score;
      saveProgress(activeSkill.id, finalScore, activeSkill.questions.length);
      setProgress(loadProgress());
      setView("result");
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
    }
  }, [activeSkill, currentQ, selected, score]);

  const backToGrid = useCallback(() => {
    setView("grid");
    setActiveSkill(null);
    setSelected(null);
  }, []);

  const colorVar = (color: string) => `var(--${color})`;

  // ─── SKILL GRID ───
  if (view === "grid") {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neon-green)] opacity-20" />
            <h1 className="font-mono-data text-3xl font-black text-[var(--neon-green)] tracking-tighter glitch-hover">
              BLOCKCHAIN_SKILLS
            </h1>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neon-green)] opacity-20" />
          </div>
          <p className="font-mono-data text-[10px] text-gray-500 text-center uppercase tracking-widest">
            blockchain challenge terminali // {completedCount}/{skills.length} tamamlandı
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-8 px-4 py-3 border border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="font-mono-data text-xs text-gray-400">
            PROGRESS: <span className="text-[var(--neon-green)]">{completedCount}/{skills.length}</span>
          </div>
          <div className="font-mono-data text-xs text-gray-400">
            TOTAL_XP: <span className="text-[var(--neon-yellow)]">{totalXP}</span>
          </div>
          <div className="flex gap-1">
            {skills.map((s) => (
              <div
                key={s.id}
                className={`w-3 h-3 border ${
                  progress[s.id]?.completed
                    ? "bg-[var(--neon-green)] border-[var(--neon-green)]"
                    : "border-gray-700 bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
            const done = progress[skill.id]?.completed;
            const pct = progress[skill.id]?.score;
            return (
              <button
                key={skill.id}
                onClick={() => openSkill(skill)}
                className={`cyber-card relative p-5 text-left flex flex-col group cursor-pointer transition-transform hover:scale-[1.02] ${
                  done ? "glow-green" : ""
                }`}
              >
                {done && (
                  <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center bg-[var(--neon-green)] text-black text-xs font-bold">
                    ✓
                  </div>
                )}

                <div className="text-2xl mb-3">{skill.icon}</div>

                <h3
                  className="font-mono-data text-sm font-bold tracking-tight mb-0.5"
                  style={{ color: colorVar(skill.color) }}
                >
                  {skill.title}
                </h3>
                <p className="font-mono-data text-[9px] text-gray-600 mb-2">{skill.subtitle}</p>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">{skill.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono-data text-[10px] text-gray-600">
                    {skill.questions.length} SORU • {skill.xpReward} XP
                  </span>
                  {done && (
                    <span className="font-mono-data text-[10px] text-[var(--neon-green)]">
                      %{pct}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!activeSkill) return null;

  // ─── SKILL INTRO ───
  if (view === "intro") {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <button onClick={backToGrid} className="font-mono-data text-[10px] text-gray-500 hover:text-[var(--neon-green)] mb-8 block">
          {"<"} SKILL_GRID
        </button>

        <div className="cyber-card p-8">
          <div className="text-4xl mb-4">{activeSkill.icon}</div>
          <h2
            className="font-mono-data text-2xl font-black tracking-tight mb-1"
            style={{ color: colorVar(activeSkill.color) }}
          >
            {activeSkill.title}
          </h2>
          <p className="font-mono-data text-[10px] text-gray-600 mb-6">{activeSkill.subtitle}</p>

          <p className="text-sm text-gray-300 leading-relaxed mb-8">{activeSkill.intro}</p>

          <div className="flex items-center justify-between mb-6 font-mono-data text-[10px] text-gray-500">
            <span>{activeSkill.questions.length} SORU</span>
            <span>{activeSkill.xpReward} XP ÖDÜL</span>
          </div>

          <button
            onClick={startQuiz}
            className="cyber-btn w-full py-3 font-mono-data text-sm font-bold tracking-widest"
            style={{
              background: colorVar(activeSkill.color),
              color: "#000",
            }}
          >
            BAŞLAT
          </button>
        </div>
      </div>
    );
  }

  const q = activeSkill.questions[currentQ];

  // ─── RESULT ───
  if (view === "result") {
    const pct = Math.round((score / activeSkill.questions.length) * 100);
    const passed = pct >= 60;
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="cyber-card p-8 text-center">
          <div className="text-5xl mb-4">{passed ? "🏆" : "💪"}</div>
          <h2
            className="font-mono-data text-2xl font-black tracking-tight mb-2"
            style={{ color: passed ? "var(--neon-green)" : "var(--neon-yellow)" }}
          >
            {passed ? "SKILL_UNLOCKED" : "TEKRAR_DENE"}
          </h2>

          <div className="flex items-center justify-center gap-8 my-8">
            <div>
              <div className="font-mono-data text-3xl font-black text-white">
                {score}/{activeSkill.questions.length}
              </div>
              <div className="font-mono-data text-[10px] text-gray-500 mt-1">DOĞRU</div>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div>
              <div
                className="font-mono-data text-3xl font-black"
                style={{ color: passed ? "var(--neon-green)" : "var(--neon-yellow)" }}
              >
                %{pct}
              </div>
              <div className="font-mono-data text-[10px] text-gray-500 mt-1">BAŞARI</div>
            </div>
            <div className="w-px h-12 bg-gray-800" />
            <div>
              <div className="font-mono-data text-3xl font-black text-[var(--neon-yellow)]">
                +{activeSkill.xpReward}
              </div>
              <div className="font-mono-data text-[10px] text-gray-500 mt-1">XP</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                startQuiz();
              }}
              className="cyber-btn flex-1 py-3 font-mono-data text-xs font-bold tracking-widest bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              TEKRAR
            </button>
            <button
              onClick={backToGrid}
              className="cyber-btn flex-1 py-3 font-mono-data text-xs font-bold tracking-widest bg-[var(--neon-green)] text-black"
            >
              DEVAM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ FLOW ───
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <button onClick={backToGrid} className="font-mono-data text-[10px] text-gray-500 hover:text-[var(--neon-green)] mb-6 block">
        {"<"} SKILL_GRID
      </button>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="font-mono-data text-[10px] font-bold"
          style={{ color: colorVar(activeSkill.color) }}
        >
          {activeSkill.title}
        </span>
        <div className="flex-1 h-1 bg-gray-800 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentQ + (selected !== null ? 1 : 0)) / activeSkill.questions.length) * 100}%`,
              background: colorVar(activeSkill.color),
            }}
          />
        </div>
        <span className="font-mono-data text-[10px] text-gray-500">
          {currentQ + 1}/{activeSkill.questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="cyber-card p-6 mb-4">
        <p className="text-base text-gray-200 leading-relaxed font-medium">{q.question}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {q.options.map((opt, idx) => {
          let style = "border-gray-800 bg-[var(--bg-card)] hover:border-gray-600 text-gray-300";
          if (selected !== null) {
            if (idx === q.correctIndex) {
              style = "border-[var(--neon-green)] bg-[rgba(0,255,170,0.08)] text-[var(--neon-green)]";
            } else if (idx === selected) {
              style = "border-[var(--neon-pink)] bg-[rgba(255,45,124,0.08)] text-[var(--neon-pink)]";
            } else {
              style = "border-gray-800 bg-[var(--bg-card)] text-gray-600 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-5 py-4 border font-mono-data text-sm transition-all ${style} ${
                selected === null ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="text-[10px] text-gray-600 mr-3">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation + Next */}
      {selected !== null && (
        <div className="mt-4">
          <div
            className={`p-4 border text-sm leading-relaxed ${
              selected === q.correctIndex
                ? "border-[var(--neon-green)] bg-[rgba(0,255,170,0.05)] text-gray-300"
                : "border-[var(--neon-pink)] bg-[rgba(255,45,124,0.05)] text-gray-300"
            }`}
          >
            <span
              className={`font-mono-data text-[10px] font-bold block mb-1 ${
                selected === q.correctIndex ? "text-[var(--neon-green)]" : "text-[var(--neon-pink)]"
              }`}
            >
              {selected === q.correctIndex ? "✓ DOĞRU!" : "✗ YANLIŞ"}
            </span>
            {q.explanation}
          </div>

          <button
            onClick={nextQuestion}
            className="cyber-btn mt-4 w-full py-3 font-mono-data text-sm font-bold tracking-widest bg-[var(--neon-green)] text-black"
          >
            {currentQ + 1 >= activeSkill.questions.length ? "SONUÇLARI GÖR" : "SONRAKİ →"}
          </button>
        </div>
      )}
    </div>
  );
}
