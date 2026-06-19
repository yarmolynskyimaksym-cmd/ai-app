export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AIStreamChunk {
  text: string;
  done: boolean;
}
