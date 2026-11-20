"use client";

/**
 * Motor de mudança de tom do player de ensaio. Recebe o áudio do player nativo
 * (MediaElementSource) e devolve para a saída.
 *
 *  • Principal: Signalsmith Stretch com compensação de formantes — preserva o timbre da voz
 *    mesmo em tons distantes.
 *  • Reserva: SoundTouch (mais leve), usado só se o principal não iniciar no aparelho.
 */
import { semitonsCompensados } from "./ensaio";

export interface MotorTom {
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

const LIMITE_ESPERA_MS = 8000;

function comLimite<T>(promessa: Promise<T>): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<never>((_, falha) => setTimeout(() => falha(new Error("motor não respondeu")), LIMITE_ESPERA_MS)),
  ]);
}

/** Liga o motor principal; se ele não iniciar neste aparelho, usa o de reserva. */
export async function criarMotor(contexto: AudioContext, fonte: AudioNode): Promise<MotorTom> {
  const principal = motorSignalsmith(contexto, fonte);
  try {
    return await comLimite(principal);
  } catch (erro) {
    console.warn("Hallel: motor principal de tom indisponível, usando o de reserva", erro);
    // Se o principal ainda terminar de iniciar depois do limite, desliga para não tocar em dobro.
    principal.then((m) => m.desligar(), () => {});
    try {
      fonte.disconnect();
    } catch {
      /* nada ligado */
    }
    return comLimite(motorSoundTouch(contexto, fonte));
  }
}
