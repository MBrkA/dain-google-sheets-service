import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
  TableUIBuilder
} from "@dainprotocol/utils";

const InputSchema = z.object({
  spreadsheetId: z.string().describe("The ID of the spreadsheet to retrieve values from"),
  range: z.string().describe("The A1 notation of the range to retrieve values from"),
  majorDimension: z.enum(["ROWS", "COLUMNS"]).optional().describe("The major dimension of the values"),
  valueRenderOption: z.enum(["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"]).optional()
    .describe("How values should be represented in the output"),
  dateTimeRenderOption: z.enum(["SERIAL_NUMBER", "FORMATTED_STRING"]).optional()
    .describe("How dates, times, and durations should be represented")
});

export const getValueConfig: ToolConfig = {
  id: "get-spreadsheet-values",
  name: "Get Spreadsheet Values",
  description: "Retrieves values from a range in a Google Spreadsheet",
  input: InputSchema,
  output: z.any(),
  handler: async ({ spreadsheetId, range, majorDimension, valueRenderOption, dateTimeRenderOption }, agentInfo, { app }) => {
    console.log("Getting spreadsheet values for agent", agentInfo.id);
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to access spreadsheet data")
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
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          params: {
            majorDimension,
            valueRenderOption,
            dateTimeRenderOption
          },
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`
          }
        }
      );

      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "values", header: "Values", type: "text" }
        ])
        .rows(response.data.values.map((row: any[]) => ({
          values: row.join(", ")
        })))
        .build();

      const cardUI = new CardUIBuilder()
        .title("Retrieved Values")
        .content(`Range: ${response.data.range}`)
        .addChild(tableUI);

      return {
        text: `Retrieved values from range ${range}`,
        data: response.data,
        ui: cardUI.build()
      };

    } catch (error) {
      console.error("Error retrieving spreadsheet values:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to retrieve spreadsheet values: ${error}`);

      return {
        text: "Failed to retrieve spreadsheet values",
        data: undefined,
        ui: alertUI.build()
      };
    }
  }
};
