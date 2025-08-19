// functions/mastra/tools/translate.ts
import { Tool } from "mastra";
import { z } from "zod";

export const translateTool = new Tool({
  name: "translate",
  description: "将文本翻译成指定语言",
  inputSchema: z.object({
    text: z.string(),
    targetLang: z.string(),
  }),
  execute: async ({ context }) => {
    const { text, targetLang } = context;
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: targetLang,
        format: "text",
      }),
    });
    const data = await res.json();
    return { translated: data.translatedText };
  },
});