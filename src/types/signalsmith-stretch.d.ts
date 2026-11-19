// Tipos mínimos para o pacote signalsmith-stretch (que não traz os seus).
declare module "signalsmith-stretch" {
  export interface StretchNode extends AudioNode {
    start(when?: number): Promise<unknown>;
    stop(when?: number): Promise<unknown>;
    schedule(opcoes: {
      output?: number;
      active?: boolean;
      input?: number;
      rate?: number;
      semitones?: number;
      tonalityHz?: number;
      formantSemitones?: number;
      formantCompensation?: boolean;
      formantBaseHz?: number;
    }): Promise<unknown>;
    latency(): Promise<number>;
  }
  export default function SignalsmithStretch(
    contexto: BaseAudioContext,
    opcoes?: AudioWorkletNodeOptions,
  ): Promise<StretchNode>;
}
