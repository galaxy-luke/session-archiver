/**
 * Helper functions for inquirer prompts
 * Provides reusable prompt configurations for user interaction
 */

import inquirer from 'inquirer';
import { SessionArchiverConfig } from '../types/config';

/**
 * Answers collected from user prompts
 */
export interface ProjectConfigAnswers {
  projectName: string;
  vaultPath: string;
  attachmentFolder: string;
  dateFormat: string;
  aiModel: string;
  maxTokens: number;
  temperature: number;
  enableDaemon: boolean;
  checkInterval: number;
  idleTimeout: number;
  sessionNoteTemplate: string;
  summaryTemplate: string;
  tagsTemplate: string;
}

/**
 * Prompt user for project configuration
 * Collects all necessary information through interactive prompts
 */
export async function promptForProjectConfig(): Promise<ProjectConfigAnswers> {
  const answers = await inquirer.prompt<ProjectConfigAnswers>([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: process.cwd().split('/').pop() || 'my-project',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Project name is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'vaultPath',
      message: 'Obsidian vault path:',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Vault path is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'attachmentFolder',
      message: 'Attachment folder (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'dateFormat',
      message: 'Date format (optional, e.g., YYYY-MM-DD):',
      default: ''
    },
    {
      type: 'list',
      name: 'aiModel',
      message: 'AI Model:',
      choices: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229'
      ],
      default: 'claude-3-5-sonnet-20241022'
    },
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Max tokens (optional):',
      default: 0,
      validate: (input: number) => {
        if (input < 0) {
          return 'Max tokens must be positive';
        }
        return true;
      }
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0-1, optional):',
      default: 0,
      validate: (input: number) => {
        if (input < 0 || input > 1) {
          return 'Temperature must be between 0 and 1';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'enableDaemon',
      message: 'Enable daemon (automatic session monitoring)?',
      default: false
    },
    {
      type: 'number',
      name: 'checkInterval',
      message: 'Daemon check interval (seconds):',
      default: 60,
      when: (answers) => answers.enableDaemon,
      validate: (input: number) => {
        if (input <= 0) {
          return 'Check interval must be positive';
        }
        return true;
      }
    },
    {
      type: 'number',
      name: 'idleTimeout',
      message: 'Idle timeout (seconds):',
      default: 300,
      when: (answers) => answers.enableDaemon,
      validate: (input: number) => {
        if (input <= 0) {
          return 'Idle timeout must be positive';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'sessionNoteTemplate',
      message: 'Session note template (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'summaryTemplate',
      message: 'Summary template (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'tagsTemplate',
      message: 'Tags template (optional):',
      default: ''
    }
  ]);

  return answers;
}

/**
 * Build SessionArchiverConfig from prompt answers
 * Converts user input into the proper configuration structure
 */
export function buildConfigFromAnswers(answers: ProjectConfigAnswers): SessionArchiverConfig {
  const config: SessionArchiverConfig = {
    projectName: answers.projectName,
    obsidian: {
      vaultPath: answers.vaultPath,
      ...(answers.attachmentFolder && { attachmentFolder: answers.attachmentFolder }),
      ...(answers.dateFormat && { dateFormat: answers.dateFormat })
    },
    ai: {
      model: answers.aiModel,
      ...(answers.maxTokens > 0 && { maxTokens: answers.maxTokens }),
      ...(answers.temperature > 0 && { temperature: answers.temperature })
    },
    archiving: {},
    daemon: {
      enabled: answers.enableDaemon,
      ...(answers.enableDaemon && answers.checkInterval > 0 && { checkInterval: answers.checkInterval }),
      ...(answers.enableDaemon && answers.idleTimeout > 0 && { idleTimeout: answers.idleTimeout })
    },
    templates: {
      ...(answers.sessionNoteTemplate && { sessionNote: answers.sessionNoteTemplate }),
      ...(answers.summaryTemplate && { summaryTemplate: answers.summaryTemplate }),
      ...(answers.tagsTemplate && { tagsTemplate: answers.tagsTemplate })
    }
  };

  return config;
}
