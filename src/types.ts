export interface Persona {
  id: string;
  name: string;
  title: string;
  facility: string;
  facility_type: string;
  size: string;
  location: string;
  age: number;
  avatar: string;
  difficulty: "簡単" | "普通" | "難しい";
  character: string;
  pain_points: string[];
  concerns: string[];
  speaking_style: string;
  hidden_need: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type AppScreen = "select" | "chat" | "feedback";
