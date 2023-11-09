import {
  autogeneratedComment,
  getFunctionName,
  getSlackCallbackId,
  renderFunctionImport,
  renderTypeImports,
} from "./utils.ts";
import { FunctionParameter, FunctionRecord } from "../types.ts";
import { manifestFunctionFieldsToTypeScript } from "./template_function.ts";

export const manifestFunctionToTypeScript = (
  functionRecord: FunctionRecord,
) => {
  return `{${manifestFunctionFieldsToTypeScript(functionRecord)}}`;
};

const renderFunctionManifestTest = (
  functionRecord: FunctionRecord,
) => {
  const functionName = getFunctionName(functionRecord.callback_id);
  const typescript: string[] = [];
  typescript.push(
    `assertEquals(${functionName}.definition.callback_id, "${
      getSlackCallbackId(functionRecord)
    }");`,
  );
  typescript.push(
    `const expected: ManifestFunctionSchema = ${
      manifestFunctionToTypeScript(
        functionRecord,
      )
    };`,
  );
  typescript.push(`const actual = ${functionName}.export();`);
  typescript.push("");
  typescript.push(`assertEquals(actual, expected);`);
  return `() => {${typescript.join("\n")}}`;
};

const workflowToTypeScript = (functionName: string) => {
  const typescript: string[] = [];
  typescript.push(`callback_id: "test_${functionName}_slack_function"`);
  typescript.push(`title: "Test ${functionName}"`);
  typescript.push(
    `description: "This is a generated test to test ${functionName}"`,
  );
  return `{${typescript.join(", \n")}}`;
};

const requiredParametersToTypeScript = (
  parameters: FunctionParameter[],
) => {
  const typescript: string[] = [];
  parameters.forEach((parameter: FunctionParameter) => {
    if (parameter.is_required) {
      typescript.push(`${parameter.name}: "test"`);
    }
  });
  return `{${typescript.join(",\n")}}`;
};

const renderWorkflowStepTest = (functionRecord: FunctionRecord) => {
  const functionName = getFunctionName(functionRecord.callback_id);
  const inputParameters = requiredParametersToTypeScript(
    functionRecord.input_parameters,
  );
  const typescript: string[] = [];
  typescript.push(
    `const testWorkflow = DefineWorkflow(${
      workflowToTypeScript(functionName)
    });`,
  );
  typescript.push(
    `testWorkflow.addStep(${functionName}, ${inputParameters});`,
  );
  typescript.push(`const actual = testWorkflow.steps[0].export();`);
  typescript.push("");
  typescript.push(
    `assertEquals(actual.function_id, "${
      getSlackCallbackId(functionRecord)
    }");`,
  );
  typescript.push(`assertEquals(actual.inputs, ${inputParameters});`);
  return `() => {${typescript.join("\n")}}`;
};

const renderOutputExistenceTest = (functionRecord: FunctionRecord) => {
  const functionName = getFunctionName(functionRecord.callback_id);
  const typescript: string[] = [];
  typescript.push(
    `const testWorkflow = DefineWorkflow(${
      workflowToTypeScript(functionName)
    });`,
  );
  typescript.push(
    `const step = testWorkflow.addStep(${functionName}, ${
      requiredParametersToTypeScript(
        functionRecord.input_parameters,
      )
    });`,
  );
  for (const parameter of functionRecord.output_parameters) {
    typescript.push(
      `assertExists(step.outputs.${parameter.name});`,
    );
  }
  return `() => {${typescript.join("\n")}}`;
};

export function SlackTestFunctionTemplate(
  functionRecord: FunctionRecord,
): string {
  const functionName = getFunctionName(functionRecord.callback_id);
  const typescript: string[] = [];
  typescript.push(autogeneratedComment());
  typescript.push(
    `import { assertEquals } from "../../../dev_deps.ts";`,
  );
  typescript.push(
    `import { DefineWorkflow } from "../../../workflows/mod.ts";`,
  );
  typescript.push(
    `import { ManifestFunctionSchema } from "../../../manifest/manifest_schema.ts";`,
  );
  typescript.push(renderTypeImports(functionRecord));
  typescript.push(renderFunctionImport(functionRecord.callback_id));
  typescript.push("");
  typescript.push(
    `Deno.test("${functionName} generates valid FunctionManifest", ${
      renderFunctionManifestTest(functionRecord)
    });`,
  );
  typescript.push("");
  typescript.push(
    `Deno.test("${functionName} can be used as a Slack function in a workflow step", ${
      renderWorkflowStepTest(functionRecord)
    });`,
  );

  if (!functionRecord.output_parameters.length) {
    return typescript.join("\n");
  }

  typescript[1] =
    `import { assertEquals, assertExists } from "../../../dev_deps.ts";`;
  typescript.push("");
  typescript.push(
    `Deno.test("All outputs of Slack function ${functionName} should exist", ${
      renderOutputExistenceTest(functionRecord)
    });`,
  );

  return typescript.join("\n");
}

export default SlackTestFunctionTemplate;
