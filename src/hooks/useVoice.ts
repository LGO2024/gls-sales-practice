import { useState, useRef, useCallback, useEffect } from "react";

export interface UseVoiceReturn {
  supported: boolean;
  listening: boolean;
  speaking: boolean;
  startListening: (onInterim: (text: string) => void, onStop: (finalText: string) => void) => void;
  stopListening: () => string;
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string>(""); // 確定済みテキストを蓄積

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = !!SpeechRecognition && !!window.speechSynthesis;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(
    (onInterim: (text: string) => void, onStop: (finalText: string) => void) => {
      if (!SpeechRecognition) return;

      window.speechSynthesis.cancel();
      setSpeaking(false);
      accumulatedRef.current = "";

      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = true;      // ← 詰まっても閉じない
      recognition.interimResults = true;

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedRef.current += transcript;
          } else {
            interim = transcript;
          }
        }
        // リアルタイム表示：確定済み + 認識中
        onInterim(accumulatedRef.current + interim);
      };

      // continuous:true の場合、onend はstop()呼び出し後のみ発火
      recognition.onend = () => {
        setListening(false);
        onStop(accumulatedRef.current);
      };

      recognition.onerror = (event: any) => {
        // no-speech は無視（沈黙しただけなので継続）
        if (event.error === "no-speech") return;
        console.error("音声認識エラー:", event.error);
        setListening(false);
        onStop(accumulatedRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [SpeechRecognition]
  );

  // 停止して確定テキストを返す
  const stopListening = useCallback((): string => {
    recognitionRef.current?.stop();
    setListening(false);
    return accumulatedRef.current;
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const jaVoice =
      voices.find((v) => v.lang === "ja-JP" && v.name.includes("Google")) ||
      voices.find((v) => v.lang === "ja-JP") ||
      voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utterance.voice = jaVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setSpeaking(false); onEnd?.(); };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, startListening, stopListening, speak, stopSpeaking };
}
