import { useState, useRef, useCallback, useEffect } from "react";

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : never;

export interface UseVoiceReturn {
  supported: boolean;
  listening: boolean;
  speaking: boolean;
  startListening: (onResult: (text: string) => void, onEnd: () => void) => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);
  const interimRef = useRef<string>("");

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = !!SpeechRecognition && !!window.speechSynthesis;

  // クリーンアップ
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(
    (onResult: (text: string) => void, onEnd: () => void) => {
      if (!SpeechRecognition) return;

      // 読み上げ中は止める
      window.speechSynthesis.cancel();
      setSpeaking(false);

      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = true;

      interimRef.current = "";

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        // リアルタイムで仮テキストを渡す（表示用）
        onResult(final || interim);
        if (final) interimRef.current = final;
      };

      recognition.onend = () => {
        setListening(false);
        onEnd();
      };

      recognition.onerror = (event: any) => {
        console.error("音声認識エラー:", event.error);
        setListening(false);
        onEnd();
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [SpeechRecognition]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // 日本語音声を優先選択
    const voices = window.speechSynthesis.getVoices();
    const jaVoice =
      voices.find((v) => v.lang === "ja-JP" && v.name.includes("Google")) ||
      voices.find((v) => v.lang === "ja-JP") ||
      voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utterance.voice = jaVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, startListening, stopListening, speak, stopSpeaking };
}
