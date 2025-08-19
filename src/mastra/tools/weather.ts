// src/mastra/tools/weather.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "weather",
  description: "查询指定城市的实时天气",
  inputSchema: z.object({
    city: z.string(),
  }),
  execute: async ({ context }) => {
    const { city } = context;
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();

    const current = data.current_condition?.[0];
    return {
      temperature: `${current.temp_C}°C`,
      weather: current.weatherDesc?.[0]?.value || "未知",
    };
  },
});
