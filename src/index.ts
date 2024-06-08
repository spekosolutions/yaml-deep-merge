import * as core from '@actions/core';
import { promises as fs } from 'fs';
import * as yaml from 'js-yaml';
import deepmerge from 'deepmerge';


const setOutput = (key: string, value: any): void => {
  try {
    core.setOutput(key, JSON.stringify(value));
  } catch (error: any) {
    core.setFailed(`Error setting output ${key}: ${error.message}`);
  }
};

const run = async (): Promise<void> => {
  try {
    const filePathsInput = core.getInput('config-files');
    core.info(`config-files input: ${filePathsInput}`); // Debug log for config-files input
    
    const keyPathInput = core.getInput('key-path');
    const keys: string[] | null = keyPathInput ? JSON.parse(keyPathInput) : null;
    core.info(`key-path input: ${keys}`); // Debug log for key-path input

    // Parse the multi-line string input into an array of file paths
    const filePaths = filePathsInput
      .split('\n')
      .map((path: string) => path.trim())
      .filter((path: string) => path.length > 0);
    core.info(`Parsed file paths: ${filePaths}`); // Debug log for parsed file paths

    // Initialize an empty object to hold the merged YAML data
    let mergedYamlData: any = {};

    // Iterate over all file paths and merge the YAML data
    for (const filePath of filePaths) {
      core.info(`Processing file: ${filePath}`); // Debug log for each file being processed
      const content = await fs.readFile(filePath, 'utf8');
      const yamlData = yaml.load(content);

      if (yamlData === null || yamlData === undefined) {
        core.setFailed(`Error in reading the YAML file: ${filePath}`);
        return;
      }

      // Deep merge the YAML data
      mergedYamlData = deepmerge(mergedYamlData, yamlData);
    }

    // Extract the desired output using the specified keys, if provided
    const output = keys ? keys.reduce((dict: any, key: string) => dict[key], mergedYamlData) : mergedYamlData;
    setOutput('data', output);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
};

run();
