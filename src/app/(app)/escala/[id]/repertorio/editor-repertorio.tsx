"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, Save, Search, X } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { allKeys } from "@/lib/music";
import { normalizarBusca } from "@/lib/musicas/busca";
import { moverItem } from "@/lib/repertorio/regras";
import { type EstadoRepertorio, salvarRepertorio } from "../../actions";

export interface MusicaOpcao {
  id: string;
  titulo: string;
  tomOriginal: string | null;
  extra: string; // hinário/artista para a busca
}

interface Item {
  chave: string;
  musicaId: string;
  tom: string;
  observacao: string;
}

const TONS = [...allKeys(false), ...allKeys(true)];
let seq = 0;
const novaChave = () => `i${++seq}`;

function Linha({
  item,
  indice,
  total,
  musica,
  mudar,
  mover,
  remover,
}: {
  item: Item;
  indice: number;
  total: number;
  musica: MusicaOpcao | undefined;
  mudar: (parcial: Partial<Item>) => void;
  mover: (para: number) => void;
  remover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.chave });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-card p-3 ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
          aria-label={`Arrastar ${musica?.titulo ?? "música"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </button>
        <span className="w-6 shrink-0 text-center font-bold text-muted-foreground">{indice + 1}</span>
        <p className="line-clamp-2 min-w-0 flex-1 leading-tight font-medium">{musica?.titulo ?? "Música removida"}</p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => mover(indice - 1)} disabled={indice === 0} aria-label="Subir">
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => mover(indice + 1)} disabled={indice === total - 1} aria-label="Descer">
          <ArrowDown />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={remover} aria-label="Tirar do repertório">
          <X />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 pl-16">
        <label className="flex items-center gap-2 text-sm">
          Tom
          <select
            value={item.tom}
            onChange={(e) => mudar({ tom: e.target.value })}
            className="h-10 rounded-lg border bg-background px-2 font-bold text-chord"
          >
            <option value="">{musica?.tomOriginal ? `${musica.tomOriginal} (original)` : "original"}</option>
            {TONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <input
          value={item.observacao}
          onChange={(e) => mudar({ observacao: e.target.value })}
          maxLength={300}
          placeholder="Observação (ex.: entrar só piano)"
          className="h-10 min-w-0 flex-1 basis-48 rounded-lg border bg-background px-3 text-base"
        />
      </div>
    </li>
  );
}

export function EditorRepertorio({
  cultoId,
  musicas,
  inicial,
  observacoesIniciais,
}: {
  cultoId: string;
  musicas: MusicaOpcao[];
  inicial: Array<{ musicaId: string; tom: string | null; observacao: string | null }>;
  observacoesIniciais: string;
}) {
  const [itens, setItens] = useState<Item[]>(() =>
    inicial.map((i) => ({ chave: novaChave(), musicaId: i.musicaId, tom: i.tom ?? "", observacao: i.observacao ?? "" })),
  );
  const [observacoes, setObservacoes] = useState(observacoesIniciais);
  const [busca, setBusca] = useState("");
  const [alterado, setAlterado] = useState(false);
  const [estado, acao, salvando] = useActionState<EstadoRepertorio, FormData>(salvarRepertorio, {});

  const porId = useMemo(() => new Map(musicas.map((m) => [m.id, m])), [musicas]);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const atualizar = (f: (l: Item[]) => Item[]) => {
    setItens(f);
    setAlterado(true);
  };

  const resultados = useMemo(() => {
    const q = normalizarBusca(busca);
    if (!q) return [];
    const usadas = new Set(itens.map((i) => i.musicaId));
    return musicas
      .filter((m) => !usadas.has(m.id) && normalizarBusca(`${m.titulo} ${m.extra}`).includes(q))
      .slice(0, 8);
  }, [busca, musicas, itens]);

  function aoSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    atualizar((l) => moverItem(l, l.findIndex((i) => i.chave === active.id), l.findIndex((i) => i.chave === over.id)));
  }

  const payload = JSON.stringify(itens.map((i) => ({ musica_id: i.musicaId, tom: i.tom, observacao: i.observacao })));

  return (
    <form
      action={(fd) => {
        setAlterado(false);
        acao(fd);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="culto_id" value={cultoId} />
      <input type="hidden" name="itens" value={payload} />

      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Nenhuma música ainda. Busque abaixo para adicionar.
        </p>
      ) : (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
          <SortableContext items={itens.map((i) => i.chave)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">
              {itens.map((item, i) => (
                <Linha
                  key={item.chave}
                  item={item}
                  indice={i}
                  total={itens.length}
                  musica={porId.get(item.musicaId)}
                  mudar={(p) => atualizar((l) => l.map((x) => (x.chave === item.chave ? { ...x, ...p } : x)))}
                  mover={(para) => atualizar((l) => moverItem(l, i, para))}
                  remover={() => atualizar((l) => l.filter((x) => x.chave !== item.chave))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="space-y-2 rounded-xl border border-dashed p-3">
        <label htmlFor="busca-musica" className="text-sm font-medium">
          Adicionar música
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="busca-musica"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Digite o nome ou o número do hinário"
            autoComplete="off"
            className="h-12 w-full rounded-lg border bg-background pr-3 pl-10 text-base"
          />
        </div>
        {busca && resultados.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma música encontrada.</p>}
        <ul className="space-y-1">
          {resultados.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  atualizar((l) => [...l, { chave: novaChave(), musicaId: m.id, tom: "", observacao: "" }]);
                  setBusca("");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent"
              >
                <Plus className="size-4 text-primary" />
                <span className="flex-1">{m.titulo}</span>
                {m.tomOriginal && <span className="text-sm font-bold text-chord">{m.tomOriginal}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Observações gerais do culto</span>
        <textarea
          name="observacoes"
          value={observacoes}
          onChange={(e) => {
            setObservacoes(e.target.value);
            setAlterado(true);
          }}
          rows={3}
          placeholder="Ex.: Ceia no final; ensaio às 17h"
          className="w-full rounded-lg border bg-background p-3 text-base"
        />
      </label>

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-[var(--nav-h,0px)] z-10 -mx-4 flex items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" disabled={salvando} className="flex-1 sm:flex-none">
          <Save /> {salvando ? "Salvando…" : "Salvar repertório"}
        </Button>
        {alterado ? (
          <span className="text-sm text-muted-foreground">Alterações não salvas</span>
        ) : (
          estado.ok &&
          !salvando && (
            <span className="flex items-center gap-1 text-sm text-primary" role="status">
              <Check className="size-4" /> Salvo
            </span>
          )
        )}
      </div>
    </form>
  );
}
