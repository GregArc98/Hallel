"use client";

/**
 * Motores de mudança de tom do player de ensaio. Os dois recebem o áudio do player nativo
 * (MediaElementSource) e devolvem para a saída; trocar de motor só reconecta a ligação.
 *
 *  • "padrao": SoundTouch (rápido, leve; a voz fica artificial acima de ~3 semitons)
 *  • "qualidade": Signalsmith Stretch com compensação de formantes (preserva o timbre da voz;
 *    exige mais processamento)
 */
import { type TipoMotor, semitonsCompensados } from "./ensaio";

export interface MotorTom {
  tipo: TipoMotor;
  aplicar(semitons: number, velocidade: number): void;
  desligar(): void;
}

const PROCESSADOR_SOUNDTOUCH = "/soundtouch-processor.js";
const URL_SIGNALSMITH = "/signalsmith-stretch.mjs";
const registrados = new WeakSet<BaseAudioContext>();

async function motorSoundTouch(contexto: AudioContext, fonte: AudioNode): Promise<MotorTom> {
  const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
  if (!registrados.has(contexto)) {
    await SoundTouchNode.register(contexto, PROCESSADOR_SOUNDTOUCH);
    registrados.add(contexto);
  }
  const no = new SoundTouchNode({ context: contexto });
  fonte.connect(no);
  no.connect(contexto.destination);
  return {
    tipo: "padrao",
    aplicar(semitons, velocidade) {
      no.playbackRate.value = velocidade; // o processador desconta o efeito da velocidade
      no.pitchSemitones.value = semitons;
    },
    desligar() {
      fonte.disconnect(no);
      no.disconnect();
    },
  };
}

async function motorSignalsmith(contexto: AudioContext, fonte: AudioNode): Promise<MotorTom> {
  // Carregado sem passar pelo empacotador: a biblioteca monta o AudioWorklet a partir do próprio
  // código, e o empacotamento quebra isso (o motor nunca fica pronto). O arquivo é copiado
  // do pacote para /public por "npm run copiar-processador".
  const { default: SignalsmithStretch } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ URL_SIGNALSMITH
  )) as typeof import("signalsmith-stretch");
  const no = await SignalsmithStretch(contexto, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
  fonte.connect(no);
  no.connect(contexto.destination);
  await no.start();
  return {
    tipo: "qualidade",
    aplicar(semitons, velocidade) {
      void no.schedule({
        semitones: semitonsCompensados(semitons, velocidade),
        // Preserva o timbre da voz ao mudar o tom (evita o som "de esquilo"/robótico).
        formantCompensation: true,
      });
    },
    desligar() {
      void no.stop();
      fonte.disconnect(no);
      no.disconnect();
    },
  };
}

export function criarMotor(tipo: TipoMotor, contexto: AudioContext, fonte: AudioNode): Promise<MotorTom> {
  return tipo === "qualidade" ? motorSignalsmith(contexto, fonte) : motorSoundTouch(contexto, fonte);
}
