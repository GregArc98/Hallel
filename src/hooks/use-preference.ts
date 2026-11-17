"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Preferência do usuário guardada neste aparelho (localStorage), ex.: tamanho da
 * fonte da cifra. Falhas de armazenamento (modo privado etc.) caem no valor padrão.
 */
const EVENT = "hallel:preference";
const PREFIX = "hallel:";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function usePreference<T extends string | number | boolean>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  let value = defaultValue;
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === typeof defaultValue) value = parsed as T;
    } catch {
      // valor corrompido: usa o padrão
    }
  }

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        // sem armazenamento disponível: a preferência vale só até recarregar
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, setValue];
}
