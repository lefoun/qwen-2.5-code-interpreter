export interface Message {
  content: string;
  role: "system" | "user" | "assistant";
}
