import { defaultBackgroundImageUrl } from "./backgroundImage";
import { isF16Supported } from "./webGpu";

export enum Setting {
  enableAiResponse = "enableAiResponse",
  enableImageSearch = "enableImageSearch",
  enableWebGpu = "enableWebGpu",
  webLlmModelId = "webLlmModelId",
  wllamaModelId = "wllamaModelId",
  cpuThreads = "cpuThreads",
  searchResultsToConsider = "searchResultsToConsider",
  backgroundImageUrl = "backgroundImageUrl",
}

export const defaultSettings = {
  [Setting.enableAiResponse]: true,
  [Setting.enableWebGpu]: true,
  [Setting.enableImageSearch]: true,
  [Setting.webLlmModelId]: isF16Supported
    ? "Qwen2-0.5B-Instruct-q4f16_1-MLC"
    : "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
  [Setting.wllamaModelId]: "default",
  [Setting.cpuThreads]: 1,
  [Setting.searchResultsToConsider]: 3,
  [Setting.backgroundImageUrl]: defaultBackgroundImageUrl,
};

export type Settings = typeof defaultSettings;