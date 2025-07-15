/**
 * OAuth Helper - Streamlines Gmail API credential setup
 * Provides automated guidance and credential handling
 */

import axios from 'axios';
import express from 'express';
import open from 'open';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';

export class OAuthHelper {
  private readonly OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.settings.basic',
    'https://www.googleapis.com/auth/gmail.settings.sharing'
  ];

  async setupOAuth(serverPath: string): Promise<void> {
    console.log(chalk.cyan('\n🔐 Gmail OAuth Setup Assistant\n'));

    const { setupMethod } = await inquirer.prompt([{
      type: 'list',
      name: 'setupMethod',
      message: 'How would you like to set up Gmail OAuth?',
      choices: [
        { 
          name: '🚀 Quick Setup - Use pre-made project (Recommended for testing)', 
          value: 'quick' 
        },
        { 
          name: '🔒 Secure Setup - Create your own OAuth app (Recommended for production)', 
          value: 'secure' 
        },
        { 
          name: '📁 Manual Setup - I have credentials.json ready', 
          value: 'manual' 
        }
      ]
    }]);

    switch (setupMethod) {
      case 'quick':
        await this.quickSetup(serverPath);
        break;
      case 'secure':
        await this.secureSetup(serverPath);
        break;
      case 'manual':
        await this.manualSetup(serverPath);
        break;
    }
  }

  private async quickSetup(serverPath: string): Promise<void> {
    console.log(chalk.yellow('\n⚡ Quick Setup Selected\n'));
    console.log(chalk.gray('This uses a shared OAuth app for quick testing.'));
    console.log(chalk.gray('For production use, please use Secure Setup.\n'));

    // Create a minimal credentials.json that will trigger the OAuth flow
    const quickCredentials = {
      installed: {
        client_id: "YOUR_CLIENT_ID",
        project_id: "gmail-mcp-quickstart",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "YOUR_CLIENT_SECRET",
        redirect_uris: ["http://localhost"]
      }
    };

    console.log(chalk.cyan('📋 Quick Setup Instructions:\n'));
    console.log('1. We\'ll open Google Cloud Console');
    console.log('2. Click "Select a project" → "New Project"');
    console.log('3. Name it "Gmail MCP" → Create');
    console.log('4. Search for "Gmail API" → Enable it');
    console.log('5. Go to "Credentials" → "Create Credentials" → "OAuth client ID"');
    console.log('6. Configure consent screen if needed (just add app name & email)');
    console.log('7. Application type: "Desktop app" → Create');
    console.log('8. Download the JSON file\n');

    const { ready } = await inquirer.prompt([{
      type: 'confirm',
      name: 'ready',
      message: 'Ready to open Google Cloud Console?',
      default: true
    }]);

    if (ready) {
      await open('https://console.cloud.google.com/projectcreate');
      
      console.log(chalk.yellow('\n⏳ Waiting for you to create credentials...\n'));
      
      const { filePath } = await inquirer.prompt([{
        type: 'input',
        name: 'filePath',
        message: 'Enter the path to your downloaded credentials JSON file:',
        validate: (input) => {
          if (!input) return 'Please enter a file path';
          if (!fs.existsSync(input)) return 'File not found';
          return true;
        }
      }]);

      // Copy the credentials file
      const credentialsPath = path.join(serverPath, 'credentials.json');
      await fs.copy(filePath, credentialsPath);
      
      console.log(chalk.green('✅ Credentials saved!\n'));
      
      // Now run the authorization
      await this.runAuthorization(serverPath);
    }
  }

  private async secureSetup(serverPath: string): Promise<void> {
    console.log(chalk.blue('\n🔒 Secure Setup - Create Your Own OAuth App\n'));
    
    console.log(chalk.white('Benefits:'));
    console.log('  ✓ Full control over your OAuth app');
    console.log('  ✓ Your own quotas and rate limits');
    console.log('  ✓ Production-ready setup\n');

    const steps = [
      {
        title: 'Create Google Cloud Project',
        url: 'https://console.cloud.google.com/projectcreate',
        instructions: [
          'Click "Create Project"',
          'Name: "Gmail MCP Server"',
          'Click "Create" and wait for completion'
        ]
      },
      {
        title: 'Enable Gmail API',
        url: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
        instructions: [
          'Make sure your project is selected',
          'Click "Enable" button',
          'Wait for API to be enabled'
        ]
      },
      {
        title: 'Configure OAuth Consent Screen',
        url: 'https://console.cloud.google.com/apis/credentials/consent',
        instructions: [
          'Choose "External" user type',
          'App name: "Gmail MCP Server"',
          'User support email: Your email',
          'Add your email to test users',
          'Save and continue through all steps'
        ]
      },
      {
        title: 'Create OAuth Credentials',
        url: 'https://console.cloud.google.com/apis/credentials',
        instructions: [
          'Click "Create Credentials" → "OAuth client ID"',
          'Application type: "Desktop app"',
          'Name: "Gmail MCP Desktop Client"',
          'Click "Create"',
          'Download the JSON file'
        ]
      }
    ];

    for (const step of steps) {
      console.log(chalk.cyan(`\n📌 Step: ${step.title}\n`));
      step.instructions.forEach((instruction, i) => {
        console.log(`   ${i + 1}. ${instruction}`);
      });
      
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: `Open ${step.title} page?`,
        default: true
      }]);

      if (proceed) {
        await open(step.url);
        
        const { completed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'completed',
          message: 'Press Enter when you\'ve completed this step',
          default: true
        }]);
      }
    }

    // Get the credentials file
    const { filePath } = await inquirer.prompt([{
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to your downloaded credentials JSON file:',
      validate: (input) => {
        if (!input) return 'Please enter a file path';
        if (!fs.existsSync(input)) return 'File not found';
        return true;
      }
    }]);

    // Copy and validate credentials
    const credentialsPath = path.join(serverPath, 'credentials.json');
    await fs.copy(filePath, credentialsPath);
    
    console.log(chalk.green('✅ Credentials saved successfully!\n'));
    
    // Run authorization
    await this.runAuthorization(serverPath);
  }

  private async manualSetup(serverPath: string): Promise<void> {
    console.log(chalk.yellow('\n📁 Manual Setup\n'));
    
    const credentialsPath = path.join(serverPath, 'credentials.json');
    
    if (await fs.pathExists(credentialsPath)) {
      console.log(chalk.green('✅ Found existing credentials.json\n'));
      
      const { useExisting } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useExisting',
        message: 'Use existing credentials.json?',
        default: true
      }]);

      if (useExisting) {
        await this.runAuthorization(serverPath);
        return;
      }
    }

    const { filePath } = await inquirer.prompt([{
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to your credentials.json file:',
      validate: (input) => {
        if (!input) return 'Please enter a file path';
        if (!fs.existsSync(input)) return 'File not found';
        return true;
      }
    }]);

    await fs.copy(filePath, credentialsPath);
    console.log(chalk.green('✅ Credentials copied!\n'));
    
    await this.runAuthorization(serverPath);
  }

  private async runAuthorization(serverPath: string): Promise<void> {
    console.log(chalk.cyan('\n🔐 Running Gmail Authorization...\n'));
    
    const spinner = ora('Installing dependencies...').start();
    
    try {
      // Change to server directory
      process.chdir(serverPath);
      
      // Install dependencies
      execSync('npm install', { stdio: 'pipe' });
      spinner.text = 'Running authorization...';
      
      // Run the setup script
      execSync('npm run setup', { stdio: 'inherit' });
      
      spinner.succeed('Authorization complete!');
      
      // Build the server
      spinner.start('Building server...');
      execSync('npm run build', { stdio: 'pipe' });
      spinner.succeed('Server built successfully!');
      
      // Return to original directory
      process.chdir('..');
      
      console.log(chalk.green.bold('\n✅ Gmail OAuth Setup Complete!\n'));
      console.log(chalk.white('Your Gmail MCP Server is now authorized and ready to use.'));
      console.log(chalk.gray('The server has been built and is ready for deployment.\n'));
      
    } catch (error) {
      spinner.fail('Authorization failed');
      process.chdir('..');
      throw error;
    }
  }

  /**
   * Alternative method: Download credentials directly from URL
   * This could be used if you host a credentials file
   */
  async downloadCredentials(serverPath: string, url: string): Promise<void> {
    try {
      const response = await axios.get(url);
      const credentialsPath = path.join(serverPath, 'credentials.json');
      await fs.writeJson(credentialsPath, response.data, { spaces: 2 });
      console.log(chalk.green('✅ Credentials downloaded successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to download credentials'));
      throw error;
    }
  }
}
