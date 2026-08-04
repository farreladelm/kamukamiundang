import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
  formErrors: string[];
  fieldErrors: FieldErrors;
};

export const initialFormActionState: FormActionState = {
  status: "idle",
  message: "",
  formErrors: [],
  fieldErrors: {},
};

export function formErrorState(
  message: string,
  fieldErrors: FieldErrors = {},
): FormActionState {
  return {
    status: "error",
    message,
    formErrors: [message],
    fieldErrors,
  };
}

export function zodErrorState(error: z.ZodError): FormActionState {
  const flattened = error.flatten();

  return {
    status: "error",
    message: "Periksa kembali data yang diisi.",
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors as FieldErrors,
  };
}

export function successState(message: string): FormActionState {
  return {
    status: "success",
    message,
    formErrors: [],
    fieldErrors: {},
  };
}
