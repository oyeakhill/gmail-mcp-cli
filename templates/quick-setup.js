#!/usr/bin/env node

/**
 * Gmail MCP Quick Setup Script
 * Automates the Gmail API credential setup process
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const open = require('open');

console.log(chalk.blue.bold('\n📧 Gmail MCP Server - Quick Setup Wizard\n'));

async function setup() {
  // Step 1: Check if server directory exists
  if (!fs.existsSync('server')) {
    console.log(chalk.red('❌ Server directory not found!'));
    console.log(chalk.yellow('Run "npx gmail-mcp-cli init" first\n'));
    process.exit(1);
  }

  console.log(chalk.green('✅ Server directory found\n'));

  // Step 2: Check for credentials
  const credentialsPath = path.join('server', 'credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.log(chalk.yellow('⚠️  Gmail API credentials not found\n'));
    
    const { openBrowser } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openBrowser',
      message: 'Open Google Cloud Console to create credentials?',
      default: true
    }]);

    if (openBrowser) {
      console.log(chalk.cyan('\n📋 Instructions:'));
      console.log('1. Create new project (or select existing)');
      console.log('2. Enable Gmail API');
      console.log('3. Create credentials → OAuth 2.0 → Desktop app');
      console.log('4. Download JSON → Save as: server/credentials.json\n');
      
      await open('https://console.cloud.google.com/apis/credentials');
      
      await inquirer.prompt([{
        type: 'confirm',
        name: 'continue',
        message: 'Press Enter when you\'ve saved credentials.json in the server folder',
        default: true
      }]);
    }
  }

  // Step 3: Run Gmail setup
  if (fs.existsSync(credentialsPath)) {
    console.log(chalk.green('✅ Credentials found\n'));
    console.log(chalk.cyan('🔐 Authorizing Gmail access...\n'));
    
    try {
      process.chdir('server');
      execSync('npm run setup', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Gmail authorization complete!'));
    } catch (error) {
      console.log(chalk.red('❌ Authorization failed'));
      process.exit(1);
    }
  }

  // Step 4: Build server
  console.log(chalk.cyan('\n🔨 Building server...'));
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(chalk.green('✅ Server built successfully!'));
  } catch (error) {
    console.log(chalk.red('❌ Build failed'));
    process.exit(1);
  }

  // Step 5: Success message
  console.log(chalk.green.bold('\n🎉 Setup Complete!\n'));
  console.log(chalk.white('Next steps:'));
  console.log('1. Restart Claude Desktop');
  console.log('2. Look for the 🔨 tools icon');
  console.log('3. Try: "Show me my recent emails"\n');
}

setup().catch(console.error);
