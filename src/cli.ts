#!/usr/bin/env node

/**
 * Gmail MCP CLI - Deploy your Gmail MCP Server easily
 * Usage: gmail-mcp init, gmail-mcp deploy, gmail-mcp status
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';
import ora from 'ora';
import boxen from 'boxen';
import { OAuthHelper } from './oauth-helper';

interface Config {
  projectName: string;
  version: string;
  deploymentTarget: 'railway' | 'render' | 'local';
  openaiApiKey?: string;
  claudeDesktopPath?: string;
}

class GmailMCPCLI {
  private config: Config;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), '.gmail-mcp.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      return fs.readJsonSync(this.configPath);
    }
    return {
      projectName: 'gmail-mcp-server',
      version: '3.0.0',
      deploymentTarget: 'local'
    };
  }

  private saveConfig(): void {
    fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
  }

  private showBanner(): void {
    console.log(boxen(
      chalk.blue.bold('📧 Gmail MCP Server CLI v3.0.0\n') +
      chalk.gray('Deploy your Gmail MCP Server with 17 tools\n') +
      chalk.yellow('🎯 Easy Deployment | 🤖 AI-Powered | 🔒 Production Ready'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));
  }

  async init(): Promise<void> {
    this.showBanner();
    
    console.log(chalk.cyan('🚀 Initializing Gmail MCP Server deployment...\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: this.config.projectName
      },
      {
        type: 'list',
        name: 'deploymentTarget',
        message: 'Choose deployment target:',
        choices: [
          { name: '🖥️  Local Development (Claude Desktop)', value: 'local' },
          { name: '🚂 Railway (Production)', value: 'railway' },
          { name: '🎨 Render (Alternative)', value: 'render' }
        ]
      },
      {
        type: 'confirm',
        name: 'autoSetupOAuth',
        message: 'Automatically set up Gmail OAuth? (No manual download needed)',
        default: true,
        when: (answers) => answers.deploymentTarget === 'local'
      },
      {
        type: 'password',
        name: 'openaiApiKey',
        message: 'OpenAI API Key (for AI features):',
        when: () => !this.config.openaiApiKey
      }
    ]);

    this.config.projectName = answers.projectName;
    this.config.deploymentTarget = answers.deploymentTarget;
    if (answers.openaiApiKey) {
      this.config.openaiApiKey = answers.openaiApiKey;
    }

    await this.setupProject(answers.autoSetupOAuth);
    this.saveConfig();

    console.log(boxen(
      chalk.green.bold('✅ Initialization Complete!\n') +
      chalk.white('Next steps:\n') +
      chalk.gray('1. gmail-mcp deploy    - Deploy your server\n') +
      chalk.gray('2. gmail-mcp status    - Check deployment status'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  }

  private async setupProject(autoSetupOAuth: boolean = false): Promise<void> {
    const spinner = ora('Setting up project...').start();

    try {
      // Copy server template to working directory
      await this.copyServerFiles();
      
      // Create environment file
      await this.createEnvironmentFile();
      
      // Setup OAuth if requested
      if (autoSetupOAuth && this.config.deploymentTarget === 'local') {
        await this.setupOAuthAutomatically();
      }
      
      // Setup deployment configuration
      await this.setupDeploymentConfig();

      spinner.succeed('Project setup complete');
    } catch (error) {
      spinner.fail('Project setup failed');
      throw error;
    }
  }

  private async copyServerFiles(): Promise<void> {
    const templatePath = path.join(__dirname, '..', 'templates', 'server-template');
    const targetPath = path.join(process.cwd(), 'server');

    if (fs.existsSync(templatePath)) {
      await fs.copy(templatePath, targetPath, {
        overwrite: true,
        errorOnExist: false,
        filter: (src) => {
          // Include all files except node_modules
          return !src.includes('node_modules');
        }
      });
      console.log(chalk.green('✅ Server files copied'));
      
      // Verify src directory was copied
      const srcPath = path.join(targetPath, 'src');
      if (!fs.existsSync(srcPath)) {
        console.error(chalk.red('❌ Error: src directory not copied'));
        throw new Error('Failed to copy src directory');
      }
    } else {
      console.log(chalk.yellow('⚠️  Using existing server files'));
    }
  }

  private async setupOAuthAutomatically(): Promise<void> {
    const oauthHelper = new OAuthHelper();
    const serverPath = path.join(process.cwd(), 'server');
    
    try {
      await oauthHelper.setupOAuth(serverPath);
      
      // Run the setup script to complete authorization
      const spinner = ora('Completing Gmail authorization...').start();
      process.chdir(serverPath);
      execSync('npm install', { stdio: 'pipe' });
      execSync('npm run build', { stdio: 'pipe' });
      process.chdir('..');
      spinner.succeed('Gmail authorization complete');
      
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Automated setup failed. Falling back to manual setup.\n'));
      
      // Show manual instructions
      console.log(boxen(
        chalk.yellow.bold('⚡ Manual Gmail API Setup\n') +
        chalk.white('1. Go to: https://console.cloud.google.com/\n') +
        chalk.white('2. Create project → Enable Gmail API\n') +
        chalk.white('3. Create OAuth credentials (Desktop app)\n') +
        chalk.white('4. Download JSON → Save as: server/credentials.json\n\n') +
        chalk.cyan('Full guide: https://github.com/akhilpal0/gmail-mcp-cli'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow'
        }
      ));
    }
  }

  private async createEnvironmentFile(): Promise<void> {
    const envContent = `# Gmail MCP Server Configuration
NODE_ENV=production
PORT=3000

# OpenAI API (for AI features)
OPENAI_API_KEY=${this.config.openaiApiKey || 'your-openai-api-key'}

# Deployment Target
DEPLOYMENT_TARGET=${this.config.deploymentTarget}

# Security (auto-generated in production)
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key

# Gmail API (set these from Google Cloud Console)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
`;

    await fs.writeFile('.env', envContent);
  }

  private async setupDeploymentConfig(): Promise<void> {
    if (this.config.deploymentTarget === 'local') {
      await this.setupLocalDeployment();
    } else if (this.config.deploymentTarget === 'railway') {
      await this.setupRailwayDeployment();
    }
  }

  private async setupLocalDeployment(): Promise<void> {
    const claudeDesktopPath = process.platform === 'win32' 
      ? path.join(process.env.APPDATA!, 'Claude', 'claude_desktop_config.json')
      : path.join(process.env.HOME!, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

    this.config.claudeDesktopPath = claudeDesktopPath;
    
    console.log(chalk.cyan('\n🖥️  Local Setup Configuration:'));
    console.log(chalk.gray(`Claude Desktop config: ${claudeDesktopPath}`));
  }

  private async setupRailwayDeployment(): Promise<void> {
    console.log(chalk.cyan('\n🚂 Railway Setup:'));
    console.log(chalk.gray('1. Install Railway CLI: npm install -g @railway/cli'));
    console.log(chalk.gray('2. Login: railway login'));
    console.log(chalk.gray('3. Deploy: gmail-mcp deploy'));
  }

  async deploy(): Promise<void> {
    console.log(chalk.cyan('🚀 Starting deployment...\n'));

    // Build the server first
    await this.buildServer();

    switch (this.config.deploymentTarget) {
      case 'railway':
        await this.deployToRailway();
        break;
      case 'local':
        await this.deployToLocal();
        break;
      case 'render':
        await this.deployToRender();
        break;
    }
  }

  private async buildServer(): Promise<void> {
    const spinner = ora('Building Gmail MCP Server...').start();
    
    try {
      const serverPath = fs.existsSync('server') ? 'server' : 'templates/server-template';
      
      if (!fs.existsSync(serverPath)) {
        throw new Error('Server files not found. Run "gmail-mcp init" first.');
      }

      // Install dependencies and build
      process.chdir(serverPath);
      console.log(chalk.cyan('📦 Installing dependencies...'));
      execSync('npm install', { stdio: 'inherit' });
      console.log(chalk.cyan('🔨 Building server...'));
      execSync('npm run build', { stdio: 'inherit' });
      process.chdir('..');
      
      spinner.succeed('Server built successfully');
    } catch (error: any) {
      spinner.fail('Build failed');
      console.error(chalk.red(error.message));
      throw error;
    }
  }

  private async deployToRailway(): Promise<void> {
    const spinner = ora('Deploying to Railway...').start();
    
    try {
      // Check if Railway CLI is installed
      try {
        execSync('railway --version', { stdio: 'ignore' });
      } catch {
        spinner.text = 'Installing Railway CLI...';
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      }

      // Deploy
      const serverPath = fs.existsSync('server') ? 'server' : 'templates/server-template';
      process.chdir(serverPath);
      
      // Initialize Railway project if needed
      if (!fs.existsSync('.railway')) {
        execSync('railway login', { stdio: 'inherit' });
        execSync('railway init', { stdio: 'inherit' });
      }

      // Set environment variables
      if (this.config.openaiApiKey) {
        execSync(`railway variables set OPENAI_API_KEY="${this.config.openaiApiKey}"`, { stdio: 'pipe' });
      }
      execSync('railway variables set NODE_ENV=production', { stdio: 'pipe' });

      // Deploy
      execSync('railway up', { stdio: 'inherit' });
      process.chdir('..');
      
      spinner.succeed('Deployed to Railway successfully');
      
      console.log(boxen(
        chalk.green.bold('🎉 Railway Deployment Successful!\n') +
        chalk.white('Your Gmail MCP Server is now live.\n') +
        chalk.gray('Check the Railway dashboard for the deployment URL.\n') +
        chalk.cyan('Run "railway logs" to view server logs.'),
        { padding: 1, borderStyle: 'round', borderColor: 'green' }
      ));
    } catch (error: any) {
      spinner.fail('Railway deployment failed');
      console.error(chalk.red(error.message));
      throw error;
    }
  }

  private async deployToLocal(): Promise<void> {
    const spinner = ora('Configuring Claude Desktop...').start();
    
    try {
      const configDir = path.dirname(this.config.claudeDesktopPath!);
      await fs.ensureDir(configDir);
      
      let claudeConfig: any = {};
      if (await fs.pathExists(this.config.claudeDesktopPath!)) {
        claudeConfig = await fs.readJson(this.config.claudeDesktopPath!);
      }
      
      if (!claudeConfig.mcpServers) {
        claudeConfig.mcpServers = {};
      }

      const serverPath = fs.existsSync('server') ? 'server' : 'templates/server-template';
      const serverDistPath = path.resolve(serverPath, 'dist', 'index.js');
      
      claudeConfig.mcpServers[this.config.projectName] = {
        command: "node",
        args: [serverDistPath],
        env: {
          OPENAI_API_KEY: this.config.openaiApiKey || "",
          NODE_ENV: "production"
        }
      };
      
      await fs.writeJson(this.config.claudeDesktopPath!, claudeConfig, { spaces: 2 });
      
      spinner.succeed('Claude Desktop configured');
      
      console.log(boxen(
        chalk.green.bold('✅ Local Deployment Complete!\n') +
        chalk.white('Gmail MCP Server configured for Claude Desktop.\n') +
        chalk.yellow('⚠️  Restart Claude Desktop to activate the server.\n') +
        chalk.cyan('Test: "List my email subscriptions" in Claude Desktop'),
        { padding: 1, borderStyle: 'round', borderColor: 'green' }
      ));
    } catch (error: any) {
      spinner.fail('Claude Desktop configuration failed');
      console.error(chalk.red(error.message));
      throw error;
    }
  }

  private async deployToRender(): Promise<void> {
    console.log(chalk.yellow('🎨 Render deployment requires manual setup:'));
    console.log(chalk.gray('1. Push your code to GitHub'));
    console.log(chalk.gray('2. Connect GitHub repo to Render'));
    console.log(chalk.gray('3. Set environment variables in Render dashboard'));
    console.log(chalk.gray('4. Deploy from Render dashboard'));
  }

  async status(): Promise<void> {
    console.log(chalk.cyan('📊 Gmail MCP Server Status\n'));
    
    // Check if server exists and is built
    const serverPath = fs.existsSync('server') ? 'server' : 'templates/server-template';
    const serverExists = fs.existsSync(serverPath);
    const distExists = fs.existsSync(path.join(serverPath, 'dist'));
    
    console.log(`Server Files: ${serverExists ? chalk.green('✅ Found') : chalk.red('❌ Missing')}`);
    console.log(`Build Status: ${distExists ? chalk.green('✅ Built') : chalk.red('❌ Not built')}`);
    
    // Check configuration
    const envExists = await fs.pathExists('.env');
    console.log(`Environment: ${envExists ? chalk.green('✅ Configured') : chalk.yellow('⚠️  Missing .env')}`);
    
    // Check deployment target specific status
    if (this.config.deploymentTarget === 'local') {
      const claudeConfigExists = this.config.claudeDesktopPath && await fs.pathExists(this.config.claudeDesktopPath);
      console.log(`Claude Desktop: ${claudeConfigExists ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);
    }
    
    console.log(`\nProject: ${this.config.projectName}`);
    console.log(`Version: ${this.config.version}`);
    console.log(`Target: ${this.config.deploymentTarget}`);
  }

  async logs(): Promise<void> {
    switch (this.config.deploymentTarget) {
      case 'railway':
        console.log(chalk.cyan('📋 Railway Logs:'));
        try {
          execSync('railway logs --tail', { stdio: 'inherit' });
        } catch {
          console.log(chalk.red('Railway CLI not found or not logged in'));
        }
        break;
      case 'local':
        const claudeLogsPath = process.platform === 'win32'
          ? path.join(process.env.APPDATA!, 'Claude', 'logs')
          : path.join(process.env.HOME!, 'Library', 'Logs', 'Claude');
        console.log(`Claude logs location: ${claudeLogsPath}`);
        console.log('Check mcp*.log files for Gmail MCP Server logs');
        break;
      default:
        console.log('Logs not available for this deployment target');
    }
  }
}

// CLI Program Setup
const program = new Command();
const cli = new GmailMCPCLI();

program
  .name('gmail-mcp')
  .description('Gmail MCP Server CLI - Easy deployment tool')
  .version('3.0.0');

program
  .command('init')
  .description('Initialize Gmail MCP Server project')
  .action(async () => {
    try {
      await cli.init();
    } catch (error: any) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy the Gmail MCP Server')
  .action(async () => {
    try {
      await cli.deploy();
    } catch (error: any) {
      console.error(chalk.red('❌ Deployment failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check deployment status')
  .action(async () => {
    try {
      await cli.status();
    } catch (error: any) {
      console.error(chalk.red('❌ Status check failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('logs')
  .description('View deployment logs')
  .action(async () => {
    try {
      await cli.logs();
    } catch (error: any) {
      console.error(chalk.red('❌ Log retrieval failed:'), error.message);
      process.exit(1);
    }
  });

program.parse();
