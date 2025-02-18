import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "./token-store";
import { createSpreadsheetConfig } from "./tools/create-spreadsheet-tool";
import { getSpreadsheetConfig } from "./tools/get-spreadsheet-tool";
import { appendValueConfig } from "./tools/spreadsheet/append-value-tool";
import { clearValueConfig } from "./tools/spreadsheet/clear-value-tool";
import { getValueConfig } from "./tools/spreadsheet/get-value-tool";
import { updateValueConfig } from "./tools/spreadsheet/update-value-tool";

export const dainService = defineDAINService({
  metadata: {
    title: "Google Sheets Service",
    description: "A DAIN service for interacting with Google Sheets",
    version: "1.0.0",
    author: "DAIN",
    tags: ["sheets", "google"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("google"),
    createSpreadsheetConfig,
    getSpreadsheetConfig,
    appendValueConfig,
    clearValueConfig,
    getValueConfig,
    updateValueConfig
  ],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
          "email",
          "profile",
        ],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId, tokens);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});
