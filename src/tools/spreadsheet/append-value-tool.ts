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
  spreadsheetId: z.string().describe("The ID of the spreadsheet to append to"),
  range: z.string().describe("The A1 notation of the range to append to"),
  values: z.array(z.array(z.any())).describe("The values to append"),
  valueInputOption: z
    .enum(["RAW", "USER_ENTERED"])
    .default("USER_ENTERED")
    .describe("How the input data should be interpreted"),
});

export const appendValueConfig: ToolConfig = {
  id: "append-spreadsheet-values",
  name: "Append to Spreadsheet",
  description: "Appends values to a Google Spreadsheet",
  input: InputSchema,
  output: z.any(),
  handler: async ({ spreadsheetId, range, values, valueInputOption }, agentInfo, { app }) => {
    console.log("Appending to spreadsheet for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to append to spreadsheets")
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
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append`,
        {
          values,
        },
        {
          params: {
            valueInputOption,
            insertDataOption: "INSERT_ROWS",
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Values Appended")
        .content(`
          Range: ${response.data.tableRange}
          Updated Range: ${response.data.updates.updatedRange}
          Updated Rows: ${response.data.updates.updatedRows}
          Updated Columns: ${response.data.updates.updatedColumns}
          Updated Cells: ${response.data.updates.updatedCells}
        `);

      return {
        text: `Appended values to spreadsheet range: ${range}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error appending to spreadsheet:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to append to spreadsheet: ${error}`);

      return {
        text: "Failed to append to spreadsheet",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
