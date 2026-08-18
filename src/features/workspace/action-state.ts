export type WorkspaceSaveState =
  | { status: "idle"; message: ""; contentVersion: number }
  | { status: "success"; message: string; contentVersion: number }
  | {
      status: "error";
      message: string;
      code: "INVALID" | "CONFLICT" | "LOCKED" | "UNAVAILABLE";
      contentVersion: number;
      currentContentVersion?: number;
    };

export const initialWorkspaceSaveState: WorkspaceSaveState = {
  status: "idle",
  message: "",
  contentVersion: 0,
};
