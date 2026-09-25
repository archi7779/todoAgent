import "dotenv/config";
export async function getChatModel(temperature = 0) {
  const provider = (process.env.LANGGRAPH_MODEL_PROVIDER ?? "ollama").toLowerCase();
  // if (provider === "ollama") {
  //   return new ChatOllama({
  //     model: process.env.OLLAMA_MODEL ?? "llama3.2",
  //     temperature,
  //   });
  // }
  if (provider === "deepseek") {
    const { ChatOpenAI } = await import("@langchain/openai");
    return new ChatOpenAI({
       configuration: {
          baseURL: "https://api.deepseek.com", // ← это важно!
        },
      model: process.env.DEEPSEEK_CHAT_MODEL,
      apiKey: process.env.DEEPSEEK_API_KEY,
      temperature,
    });
  }

  throw new Error(
    `Unknown LANGGRAPH_MODEL_PROVIDER=${provider} (use ollama|openai|anthropic)`,
  );
}