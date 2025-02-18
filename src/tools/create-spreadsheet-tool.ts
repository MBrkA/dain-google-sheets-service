import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const InputSchema = z.object({
  title: z.string().describe("The title of the new spreadsheet"),
});

export const createSpreadsheetConfig: ToolConfig = {
  id: "create-spreadsheet",
  name: "Create Spreadsheet",
  description: "Creates a new Google Spreadsheet",
  input: InputSchema,
  output: z.any(),
  handler: async ({ title }, agentInfo, { app }) => {
    console.log("Creating spreadsheet for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to create a spreadsheet")
        .logo(
          "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
        )
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.post(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          properties: {
            title,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Spreadsheet Created")
        .content(`
          Title: ${response.data.properties.title}
          ID: ${response.data.spreadsheetId}
          URL: ${response.data.spreadsheetUrl}
        `);

      return {
        text: `Created spreadsheet: ${title}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to create spreadsheet: ${error}`);

      return {
        text: "Failed to create spreadsheet",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
