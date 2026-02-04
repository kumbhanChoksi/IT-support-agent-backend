import { createTicketSchema, editTicketSchema } from "./toolSchemas";

const ISSUE_ENUM = [
  "wifi_not_working",
  "email_login_issue",
  "slow_laptop_performance",
  "printer_problem",
] as const;

export const baseUrl = process.env.VAPI_BASE_URL ?? "";

function parametersFromSchema(
  schema: typeof createTicketSchema | typeof editTicketSchema
): {
  type: "object";
  properties: Record<string, { type: string; enum?: readonly string[] }>;
  required: string[];
  additionalProperties: false;
} {
  if (schema === createTicketSchema) {
    return {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
        issue: { type: "string", enum: [...ISSUE_ENUM] },
      },
      required: ["name", "email", "phone", "address", "issue"],
      additionalProperties: false,
    };
  }
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      phone: { type: "string" },
      address: { type: "string" },
      issue: { type: "string", enum: [...ISSUE_ENUM] },
    },
    required: ["id"],
    additionalProperties: false,
  };
}

export const createTicketTool = {
  type: "function" as const,
  function: {
    name: "create_ticket",
    description: "Create a new support ticket with customer details and issue type.",
    parameters: parametersFromSchema(createTicketSchema),
  }
};

export const editTicketTool = {
  type: "function" as const,
  function: {
    name: "edit_ticket",
    description: "Update an existing support ticket by ID. Only provided fields are updated.",
    parameters: parametersFromSchema(editTicketSchema),
  }
};
