"use client";

import {
  AArrowDown,
  AArrowUp,
  ChevronsDown,
  Guitar,
  Maximize2,
  MicVocal,
  Minus,
  Pause,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { usePreference } from "@/hooks/use-preference";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  type AccidentalPreference,
  mod12,
  parseChordPro,
  semitonesBetween,
  transposeKey,
  transposeSong,
} from "@/lib/music";
import { cn } from "@/lib/utils";
import { ChordSheet, type SheetMode } from "./chord-sheet";
import { TomDaCifra } from "./tom-context";

const FONT_MIN = 14;
const FONT_MAX = 44;
const FONT_STEP = 2;

export interface SongViewerProps {
  title: string;
  subtitle?: string;
  /** Cifra salva (ChordPro). */
  chordpro: string;
  /** Tom em que a cifra está escrita. */
  originalKey: string | null;
  /** Tom em que deve abrir (ex.: tom definido para o culto). */
  initialKey?: string | null;
  /** Rótulo do tom inicial, ex.: "Tom do culto". */
  initialKeyLabel?: string;
  defaultMode?: SheetMode;
  /** Começa no modo palco (o modo culto mantém o palco ao trocar de música). */
  palcoInicial?: boolean;
  onPalcoChange?: (ativo: boolean) => void;
  /** Conteúdo extra abaixo dos controles (ex.: player de áudio). */
  children?: ReactNode;
}

/** Normaliza para -5..+6 (o caminho mais curto). */
function normalizeOffset(n: number): number {
  const m = mod12(n);
  return m > 6 ? m - 12 : m;
}

function formatOffset(n: number): string {
  if (n === 0) return "original";
  return `${n > 0 ? "+" : "−"}${Math.abs(n)} semitom${Math.abs(n) > 1 ? "s" : ""}`;
}

export function SongViewer({
  title,
  subtitle,
  chordpro,
  originalKey,
  initialKey,
  initialKeyLabel = "Tom do culto",
  defaultMode = "cifra",
  palcoInicial = false,
  onPalcoChange,
  children,
}: SongViewerProps) {
  const initialOffset =
    originalKey && initialKey ? semitonesBetween(originalKey, initialKey) : 0;

  const [offset, setOffset] = useState(initialOffset);
  const [mode, setMode] = useState<SheetMode>(defaultMode);
  const [accidental, setAccidental] = usePreference<string>("cifra.acidente", "auto");
  const [fontSize, setFontSize] = usePreference<number>("cifra.fonte", 18);
  const [stageFontSize, setStageFontSize] = usePreference<number>("cifra.fontePalco", 24);
  const [speed, setSpeed] = usePreference<number>("cifra.rolagem", 4);
  const [stage, setStage] = useState(palcoInicial);
  const [scrolling, setScrolling] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const enteredFullscreen = useRef(false);

  const accidentalPref = (["auto", "sharp", "flat"].includes(accidental)
    ? accidental
    : "auto") as AccidentalPreference;

  const song = useMemo(() => parseChordPro(chordpro), [chordpro]);
  const currentKey = originalKey
    ? transposeKey(originalKey, offset, { accidental: accidentalPref })
    : null;
  const shown = useMemo(
    () => transposeSong(song, offset, { accidental: accidentalPref, targetKey: currentKey }),
    [song, offset, accidentalPref, currentKey],
  );

  useWakeLock(stage || scrolling);
  const stopScrolling = useCallback(() => setScrolling(false), []);
  useAutoScroll({
    active: scrolling,
    speed,
    target: stage ? stageRef : null,
    onEnd: stopScrolling,
  });

  const enterStage = () => {
    setScrolling(false);
    setStage(true);
    onPalcoChange?.(true);
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => {
          enteredFullscreen.current = true;
        })
        .catch(() => {});
    }
  };

  const exitStage = useCallback(() => {
    setScrolling(false);
    setStage(false);
    onPalcoChange?.(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    enteredFullscreen.current = false;
  }, [onPalcoChange]);

  // No palco: trava a rolagem da página de trás, fecha com Esc ou ao sair da tela cheia.
  useEffect(() => {
    if (!stage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitStage();
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement && enteredFullscreen.current) exitStage();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [stage, exitStage]);

  const changeFont = (delta: number) => {
    const [value, set] = stage ? [stageFontSize, setStageFontSize] : [fontSize, setFontSize];
    set(Math.min(FONT_MAX, Math.max(FONT_MIN, value + delta)));
  };

  const keyLabel = currentKey ?? formatOffset(normalizeOffset(offset));
  const isInitial = normalizeOffset(offset) === normalizeOffset(initialOffset);
  const resetLabel = initialKey ? initialKeyLabel : "Tom original";

  const keyStepper = (big: boolean) => (
    <div className="flex items-center gap-1" role="group" aria-label="Mudar o tom">
      <Button
        variant="outline"
        size={big ? "icon" : "icon-sm"}
        onClick={() => setOffset((o) => o - 1)}
        aria-label="Baixar meio tom"
      >
        <Minus />
      </Button>
      <span className="flex min-w-14 flex-col items-center leading-none" aria-live="polite">
        <span
          className={cn(
            "font-bold tabular-nums",
            big ? "text-2xl" : "text-xl",
            currentKey ? "text-chord" : "text-sm text-muted-foreground",
          )}
          aria-label={currentKey ? `Tom ${currentKey}` : keyLabel}
        >
          {keyLabel}
        </span>
        {!big && originalKey && normalizeOffset(offset) !== 0 && (
          <span className="mt-0.5 text-[11px] text-muted-foreground">orig. {originalKey}</span>
        )}
      </span>
      <Button
        variant="outline"
        size={big ? "icon" : "icon-sm"}
        onClick={() => setOffset((o) => o + 1)}
        aria-label="Subir meio tom"
      >
        <Plus />
      </Button>
    </div>
  );

  const scrollControls = (
    <div className="flex items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
      {scrolling && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setSpeed(Math.max(1, speed - 1))}
            aria-label="Rolar mais devagar"
          >
            <Minus />
          </Button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-label={`Velocidade ${speed}`}>
            {speed}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setSpeed(Math.min(10, speed + 1))}
            aria-label="Rolar mais rápido"
          >
            <Plus />
          </Button>
        </>
      )}
      <Button
        className="rounded-full"
        onClick={() => setScrolling((s) => !s)}
        aria-pressed={scrolling}
      >
        {scrolling ? <Pause /> : <ChevronsDown />}
        {scrolling ? "Parar" : "Rolar"}
      </Button>
    </div>
  );

  if (stage) {
    return (
      <TomDaCifra value={normalizeOffset(offset)}>
      <div
        ref={stageRef}
        className="dark fixed inset-0 z-50 overflow-y-auto bg-background text-foreground"
        role="dialog"
        aria-modal="true"
        aria-label={`Modo palco: ${title}`}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{title}</p>
          </div>
          {mode === "cifra" && keyStepper(true)}
          <Button variant="secondary" size="icon" onClick={exitStage} aria-label="Sair do modo palco">
            <X />
          </Button>
        </div>
        <ChordSheet song={shown} mode={mode} fontSize={stageFontSize} className="px-4 pt-6 pb-40" />
        <div className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => changeFont(-FONT_STEP)} aria-label="Diminuir letra">
              <AArrowDown />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => changeFont(FONT_STEP)} aria-label="Aumentar letra">
              <AArrowUp />
            </Button>
          </div>
          {scrollControls}
        </div>
      </div>
      </TomDaCifra>
    );
  }

  return (
    <TomDaCifra value={normalizeOffset(offset)}>
    <div className="pb-28">
      <header className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </header>

      <div className="sticky top-0 z-10 -mx-4 mb-5 space-y-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Segmented<SheetMode>
            ariaLabel="O que mostrar"
            value={mode}
            onChange={setMode}
            options={[
              { value: "cifra", label: <><Guitar /> Cifra</> },
              { value: "letra", label: <><MicVocal /> Letra</> },
            ]}
          />
          <div className="ml-auto flex shrink-0 items-center">
            <Button variant="ghost" size="icon" onClick={() => changeFont(-FONT_STEP)} aria-label="Diminuir letra">
              <AArrowDown className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => changeFont(FONT_STEP)} aria-label="Aumentar letra">
              <AArrowUp className="size-5" />
            </Button>
            <Button
              variant="outline"
              className="px-3 max-[380px]:w-11 max-[380px]:px-0"
              onClick={enterStage}
              aria-label="Modo palco"
              title="Modo palco: tela cheia, escura e sempre ligada"
            >
              <Maximize2 /> <span className="max-[380px]:hidden">Palco</span>
            </Button>
          </div>
        </div>

        {mode === "cifra" && (
          <div className="flex items-center gap-2">
            {keyStepper(false)}
            {!isInitial && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOffset(initialOffset)}
                aria-label={`Voltar ao ${resetLabel.toLowerCase()}`}
                title={resetLabel}
              >
                <RotateCcw />
              </Button>
            )}
            <Segmented<AccidentalPreference>
              className="ml-auto"
              ariaLabel="Sustenido ou bemol"
              value={accidentalPref}
              onChange={setAccidental}
              options={[
                { value: "sharp", label: <span className="text-lg leading-none">♯</span>, ariaLabel: "Usar sustenidos" },
                { value: "auto", label: "Auto", ariaLabel: "Escolher pelo tom" },
                { value: "flat", label: <span className="text-lg leading-none">♭</span>, ariaLabel: "Usar bemóis" },
              ]}
            />
          </div>
        )}
      </div>

      {children}

      <ChordSheet song={shown} mode={mode} fontSize={fontSize} />

      <div className="fixed right-4 bottom-[calc(1rem+var(--nav-h,0px))] z-20 pb-[env(safe-area-inset-bottom)]">
        {scrollControls}
      </div>
    </div>
    </TomDaCifra>
  );
}
