
export enum EditMode {
  Generate = 'generate',
  Edit = 'edit',
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface ImageHistoryState {
  history: string[];
  currentIndex: number;
}
