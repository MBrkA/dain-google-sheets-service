import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const InputSchema = z.object({
  spreadsheetId: z.string().describe("The ID of the spreadsheet to clear"),
  range: z.string().describe("The A1 notation of the range to clear"),
});

export const clearValueConfig: ToolConfig = {
  id: "clear-spreadsheet-values",
  name: "Clear Spreadsheet Range",
  description: "Clears values from a range in a Google Spreadsheet",
  input: InputSchema,
  output: z.any(),
  handler: async ({ spreadsheetId, range }, agentInfo, { app }) => {
    console.log("Clearing spreadsheet range for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to clear spreadsheet data")
        .logo("https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")
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
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Range Cleared")
        .content(`
          Spreadsheet ID: ${response.data.spreadsheetId}
          Cleared Range: ${response.data.clearedRange}
        `);

      return {
        text: `Cleared range ${range} in spreadsheet`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error clearing spreadsheet range:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to clear spreadsheet range: ${error}`);

      return {
        text: "Failed to clear spreadsheet range",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
