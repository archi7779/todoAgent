import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,  // 👈 вместо .extend()
  
  // добавляем свои кастомные поля
  llmCalls: Annotation<number>({
    reducer: (current, update) => current + update, 
    default: () => 0,
  }),
  totalTokens: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),
});