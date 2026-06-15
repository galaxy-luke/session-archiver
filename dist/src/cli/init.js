"use strict";
/**
 * Init command implementation
 * Handles interactive configuration initialization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
exports.handleInitCommand = handleInitCommand;
const commander_1 = require("commander");
const configManager_1 = require("../utils/configManager");
const promptHelper_1 = require("../utils/promptHelper");
const inquirer_1 = __importDefault(require("inquirer"));
/**
 * Action handler for init command
 */
async function handleInitCommand() {
    try {
        const configManager = new configManager_1.ConfigManager();
        // Check if config already exists
        if (configManager.projectConfigExists()) {
            console.log('Configuration file already exists.');
            console.log(`Current location: ${configManager.getProjectConfigPath()}`);
            const { overwrite } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Do you want to overwrite the existing configuration?',
                    default: false
                }
            ]);
            if (!overwrite) {
                console.log('Configuration initialization cancelled.');
                return;
            }
            console.log('Proceeding with configuration update...');
        }
        // Prompt for configuration
        console.log('Welcome to Session Archiver setup!');
        console.log('Please answer the following questions to configure your project.\n');
        const answers = await (0, promptHelper_1.promptForProjectConfig)();
        // Build configuration from answers
        const config = (0, promptHelper_1.buildConfigFromAnswers)(answers);
        // Validate configuration
        const validation = configManager.validateConfig(config);
        if (!validation.isValid) {
            console.error('Configuration validation failed:');
            validation.errors.forEach((error) => {
                console.error(`  - ${error}`);
            });
            process.exit(1);
        }
        // Save configuration
        try {
            configManager.saveProjectConfig(config);
        }
        catch (error) {
            console.error('Failed to save configuration:', error);
            process.exit(1);
        }
        // Display success message
        console.log('\n✓ Configuration initialized successfully!');
        console.log(`\nConfiguration saved to: ${configManager.getProjectConfigPath()}`);
        console.log('\nNext steps:');
        console.log('  1. Review your configuration with: session-archiver config show');
        console.log('  2. Set up AI API key (if needed): session-archiver config set ai.apiKey');
        console.log('  3. Run a manual archive: session-archiver archive');
        console.log('  4. Or start the daemon: session-archiver daemon start');
    }
    catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}
exports.initCommand = new commander_1.Command('init')
    .description('Initialize session archiver configuration')
    .action(handleInitCommand);
//# sourceMappingURL=init.js.map