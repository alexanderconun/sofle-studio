import { useEffect, useMemo, useRef, useState } from "react";
import type { Keymap as KeymapMsg, PhysicalLayout } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { GenericModal } from "../GenericModal";
import { useModalRef } from "../misc/useModalRef";
import { Keymap } from "./Keymap";
import { keyFace } from "./KeyFace";
import { buildTargets, judge, pickNext, Target, usageForCode } from "./practiceDrill";
import { pressedPositions } from "./pressedKeys";

export interface PracticeProps {
  open: boolean;
  onClose: () => void;
  keymap: KeymapMsg;
  layout: PhysicalLayout;
  behaviors: Record<number, GetBehaviorDetailsResponse>;
}

const HINT_AFTER_MS = 3000;
const keyId = (t: Target) => `${t.layerIndex}:${t.position}`;

// Drill: shows a key/shortcut from a layer, you press it on the keyboard.
export const Practice = ({ open, onClose, keymap, layout, behaviors }: PracticeProps) => {
  const ref = useModalRef(open, false, false);
  const layerName = (i: number) => keymap.layers[i]?.name || `Layer ${i}`;

  const targetsByLayer = useMemo(
    () => keymap.layers.map((_, i) => buildTargets(keymap, behaviors, i)),
    [keymap, behaviors]
  );
  const choices = targetsByLayer
    .map((t, i) => ({ i, count: t.length }))
    .filter((c) => c.count >= 3);
  const [choice, setChoice] = useState<number | "all">(choices.find((c) => c.i === 1)?.i ?? "all");
  const pool = useMemo(
    () => (choice === "all" ? choices.flatMap((c) => targetsByLayer[c.i]) : targetsByLayer[choice] ?? []),
    [choice, targetsByLayer]
  );

  const misses = useRef(new Map<string, number>());
  const [target, setTarget] = useState<Target | undefined>();
  const [shownAt, setShownAt] = useState(0);
  const [hint, setHint] = useState(false);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const [held, setHeld] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ hits: 0, misses: 0, streak: 0, best: 0, totalMs: 0 });

  const next = (last?: Target) => {
    if (!pool.length) return setTarget(undefined);
    setTarget(pickNext(pool, misses.current, last));
    setShownAt(performance.now());
    setHint(false);
  };

  useEffect(() => {
    if (open) next();
  }, [open, pool]);

  useEffect(() => {
    if (!open || !target || hint) return;
    const t = setTimeout(() => setHint(true), HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [open, target, hint]);

  useEffect(() => {
    if (!open) return;
    const down = (e: KeyboardEvent) => {
      // Keep keys away from the rest of Studio (and the dialog's Esc-to-close).
      e.preventDefault();
      e.stopPropagation();
      const usage = usageForCode(e.code);
      if (usage !== undefined) setHeld((h) => new Set(h).add(usage));
      if (e.repeat || !target) return;
      const result = judge(e, target);
      if (!result) return;
      setFlash(result);
      setTimeout(() => setFlash(null), 250);
      if (result === "hit") {
        const ms = performance.now() - shownAt;
        setStats((s) => {
          const streak = s.streak + 1;
          return { ...s, hits: s.hits + 1, streak, best: Math.max(s.best, streak), totalMs: s.totalMs + ms };
        });
        setTimeout(() => next(target), 150);
      } else {
        misses.current.set(keyId(target), (misses.current.get(keyId(target)) ?? 0) + 1);
        setStats((s) => ({ ...s, misses: s.misses + 1, streak: 0 }));
        setHint(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      const usage = usageForCode(e.code);
      if (usage === undefined) return;
      setHeld((h) => {
        const n = new Set(h);
        n.delete(usage);
        return n;
      });
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
    };
  }, [open, target, shownAt, pool]);

  const face = target
    ? keyFace(behaviors[target.binding.behaviorId]?.displayName, target.binding as any, layerName)
    : undefined;
  const accuracy = stats.hits + stats.misses ? Math.round((100 * stats.hits) / (stats.hits + stats.misses)) : 100;
  const avg = stats.hits ? (stats.totalMs / stats.hits / 1000).toFixed(1) : "–";
  const troubleKeys = [...misses.current.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => pool.find((t) => keyId(t) === id))
    .filter((t): t is Target => !!t);

  return (
    <GenericModal ref={ref} onClose={onClose} className="w-[56rem] max-w-[95vw]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold mr-2">Practice</span>
          {[...choices.map((c) => c.i), "all" as const].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(c)}
              className={`px-3 h-8 rounded ${choice === c ? "bg-primary text-primary-content" : "bg-base-200 hover:bg-base-300"}`}
            >
              {c === "all" ? "All layers" : layerName(c)}
            </button>
          ))}
          <button type="button" onClick={onClose} className="ml-auto px-3 h-8 rounded bg-base-200 hover:bg-base-300">
            Done
          </button>
        </div>

        {!target ? (
          <p>No practisable keys on this layer.</p>
        ) : (
          <div
            className={`rounded-lg p-6 flex flex-col items-center gap-2 transition-colors ${
              flash === "hit" ? "bg-emerald-500/30" : flash === "miss" ? "bg-rose-500/30" : "bg-base-200"
            }`}
          >
            <div className="text-base-content/60">
              {target.layerIndex === 0 ? "On the base layer, press" : `Hold ${layerName(target.layerIndex)}, then press`}
            </div>
            <div className="text-[3rem] leading-none font-semibold min-h-16 flex items-center">
              {face?.content ?? face?.header}
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            ["Correct", stats.hits],
            ["Missed", stats.misses],
            ["Accuracy", `${accuracy}%`],
            ["Streak", `${stats.streak} (best ${stats.best})`],
            ["Avg time", `${avg}s`],
          ].map(([label, value]) => (
            <div key={label} className="rounded bg-base-200 p-2">
              <div className="text-[0.75rem] text-base-content/60">{label}</div>
              <div className="font-semibold">{value}</div>
            </div>
          ))}
        </div>

        <div className="min-h-48 grid place-items-center rounded-lg bg-base-300 p-3">
          {target && hint ? (
            <Keymap
              keymap={keymap}
              layout={layout}
              behaviors={behaviors}
              scale={0.8}
              selectedLayerIndex={target.layerIndex}
              selectedKeyPosition={target.position}
              pressedPositions={pressedPositions(keymap, behaviors, target.layerIndex, held)}
              resolveTransparent
              onKeyPositionClicked={() => {}}
            />
          ) : (
            <button type="button" className="text-base-content/50 underline" onClick={() => setHint(true)}>
              Show where it is (appears by itself after 3s or a miss)
            </button>
          )}
        </div>

        {troubleKeys.length > 0 && (
          <div className="flex items-center gap-2 text-[0.85rem]">
            <span className="text-base-content/60">Trouble keys (come up more often):</span>
            {troubleKeys.map((t) => (
              <span key={keyId(t)} className="px-2 rounded bg-rose-500/20">
                {keyFace(behaviors[t.binding.behaviorId]?.displayName, t.binding as any, layerName).content}
              </span>
            ))}
          </div>
        )}
      </div>
    </GenericModal>
  );
};
