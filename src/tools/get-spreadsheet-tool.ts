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
  spreadsheetId: z.string().describe("The ID of the spreadsheet to retrieve"),
});

export const getSpreadsheetConfig: ToolConfig = {
  id: "get-spreadsheet",
  name: "Get Spreadsheet",
  description: "Retrieves a Google Spreadsheet by ID",
  input: InputSchema,
  output: z.any(),
  handler: async ({ spreadsheetId }, agentInfo, { app }) => {
    console.log("Getting spreadsheet for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to access spreadsheets")
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
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Spreadsheet Details")
        .content(`
          Title: ${response.data.properties.title}
          ID: ${response.data.spreadsheetId}
          URL: ${response.data.spreadsheetUrl}
          Locale: ${response.data.properties.locale}
          Timezone: ${response.data.properties.timeZone}
          Number of Sheets: ${response.data.sheets.length}
        `);

      return {
        text: `Retrieved spreadsheet: ${response.data.properties.title}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error retrieving spreadsheet:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to retrieve spreadsheet: ${error}`);

      return {
        text: "Failed to retrieve spreadsheet",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
