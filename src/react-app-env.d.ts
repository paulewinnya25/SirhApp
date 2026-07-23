/// <reference types="react-scripts" />

declare module 'react-icons/lib/iconBase' {
  export type IconType = (props?: any) => JSX.Element;
}

declare module 'react-icons/lib' {
  export type IconType = (props?: any) => JSX.Element;
}

declare module 'lucide-react';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface Window {
  SpeechRecognition?: { new (): SpeechRecognition };
  webkitSpeechRecognition?: { new (): SpeechRecognition };
  webkitAudioContext?: typeof AudioContext;
  AudioContext: typeof AudioContext;
}
