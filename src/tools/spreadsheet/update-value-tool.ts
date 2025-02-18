import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder
} from "@dainprotocol/utils";

const InputSchema = z.object({
  spreadsheetId: z.string().describe("The ID of the spreadsheet to update"),
  range: z.string().describe("The A1 notation of the range to update"),
  values: z.array(z.array(z.any())).describe("The values to update"),
  valueInputOption: z.enum(["RAW", "USER_ENTERED"]).default("USER_ENTERED")
    .describe("How the input data should be interpreted"),
  includeValuesInResponse: z.boolean().optional()
    .describe("Whether to include values in the response"),
});

export const updateValueConfig: ToolConfig = {
  id: "update-spreadsheet-values", 
  name: "Update Spreadsheet Values",
  description: "Updates values in a range of a Google Spreadsheet",
  input: InputSchema,
  output: z.any(),
  handler: async ({ spreadsheetId, range, values, valueInputOption, includeValuesInResponse }, agentInfo, { app }) => {
    console.log("Updating spreadsheet values for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to update spreadsheet data")
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
      const response = await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          values
        },
        {
          params: {
            valueInputOption,
            includeValuesInResponse
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Values Updated")
        .content(`
          Updated Range: ${response.data.updatedRange}
          Updated Rows: ${response.data.updatedRows}
          Updated Columns: ${response.data.updatedColumns}
          Updated Cells: ${response.data.updatedCells}
        `);

      return {
        text: `Updated values in range ${range}`,
        data: response.data,
        ui: cardUI.build()
      };

    } catch (error) {
      console.error("Error updating spreadsheet values:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to update spreadsheet values: ${error}`);

      return {
        text: "Failed to update spreadsheet values", 
        data: undefined,
        ui: alertUI.build()
      };
    }
  }
};
