import SchemaTypes from "../../../schema_types.ts";
import { DefineType } from "../../../../types/mod.ts";

export const oAuthTypeId = "slack#/types/credential/oauth";

export const OAuthType = DefineType({
  name: oAuthTypeId,
  type: SchemaTypes.object,
  properties: {
    credential_source: {
      type: SchemaTypes.string,
      enum: ["DEVELOPER"], // TODO: Double check these are the available values
    },
  },
  required: ["credential_source"],
});