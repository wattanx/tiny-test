const fs = require("fs");

const expect = require("expect");
const mock = require("jest-mock");
const { dirname, join, basename } = require("path");
const { describe, it, run, resetState } = require("jest-circus");
const vm = require("vm");
const NodeEnvironment = require("jest-environment-node").default;

exports.runTest = async function (testFile) {
  const testResult = {
    success: false,
    errorMessage: null,
  };
  try {
    resetState();
    let environment;
    const customRequire = (fileName) => {
      const code = fs.readFileSync(join(dirname(testFile), fileName), "utf8");
      const moduleFactory = vm.runInContext(
        // Inject require as a variable here.
        `(function(module, require) {${code}})`,
        environment.getVmContext()
      );
      const module = { exports: {} };
      // And pass customRequire into our moduleFactory.
      moduleFactory(module, customRequire);
      return module.exports;
    };
    environment = new NodeEnvironment({
      projectConfig: {
        testEnvironmentOptions: {
          describe,
          it,
          expect,
          mock,
        },
      },
    });
    // Use `customRequire` to run the test file.
    customRequire(basename(testFile));
    const { testResults } = await run();
    testResult.testResults = testResults;
    testResult.success = testResults.every((result) => !result.errors.length);
  } catch (error) {
    testResult.errorMessage = error.message;
  }
  return testResult;
};
