#!/usr/bin/env node

/**
 * Production Readiness Check CLI Tool
 * 
 * This tool runs comprehensive production readiness checks for the MCP Threading System
 * 
 * Usage:
 *   node readiness-check.js [options]
 *   npm run readiness:check
 */

import { ProductionReadinessChecker, CheckSeverity, CheckStatus } from './ProductionReadinessChecker.js';
import { LoggingService } from './LoggingService.js';
import { ThreadingService } from './ThreadingService.js';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Format console output with colors
 */
function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Print formatted header
 */
function printHeader(title: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(colorize(title, 'bright'));
  console.log('='.repeat(60));
}

/**
 * Print check result
 */
function printCheck(check: any): void {
  let statusIcon = '';
  let statusColor: keyof typeof colors = 'white';
  
  switch (check.status) {
    case CheckStatus.PASS:
      statusIcon = '✅';
      statusColor = 'green';
      break;
    case CheckStatus.FAIL:
      statusIcon = '❌';
      statusColor = 'red';
      break;
    case CheckStatus.SKIP:
      statusIcon = '⏭️';
      statusColor = 'yellow';
      break;
  }
  
  let severityColor: keyof typeof colors = 'white';
  switch (check.severity) {
    case CheckSeverity.CRITICAL:
      severityColor = 'red';
      break;
    case CheckSeverity.ERROR:
      severityColor = 'red';
      break;
    case CheckSeverity.WARNING:
      severityColor = 'yellow';
      break;
    case CheckSeverity.INFO:
      severityColor = 'blue';
      break;
  }
  
  console.log(`${statusIcon} ${colorize(check.name, statusColor)} ${colorize(`[${check.severity.toUpperCase()}]`, severityColor)}`);
  console.log(`   ${check.message}`);
  
  if (check.recommendation) {
    console.log(`   ${colorize('💡 Recommendation:', 'cyan')} ${check.recommendation}`);
  }
  
  if (check.details && Object.keys(check.details).length > 0) {
    console.log(`   ${colorize('📊 Details:', 'blue')} ${JSON.stringify(check.details)}`);
  }
  
  console.log(`   ${colorize('⏱️ Duration:', 'magenta')} ${check.duration}ms`);
  console.log();
}

/**
 * Print summary
 */
function printSummary(assessment: any): void {
  printHeader('PRODUCTION READINESS SUMMARY');
  
  // Overall status
  let overallColor: keyof typeof colors = 'green';
  let overallIcon = '✅';
  
  switch (assessment.overall) {
    case 'not_ready':
      overallColor = 'red';
      overallIcon = '❌';
      break;
    case 'warning':
      overallColor = 'yellow';
      overallIcon = '⚠️';
      break;
    case 'ready':
      overallColor = 'green';
      overallIcon = '✅';
      break;
  }
  
  console.log(`${overallIcon} ${colorize('Overall Status:', 'bright')} ${colorize(assessment.overall.toUpperCase(), overallColor)}`);
  console.log(`📊 ${colorize('Readiness Score:', 'bright')} ${colorize(`${assessment.score}/100`, assessment.score >= 80 ? 'green' : assessment.score >= 60 ? 'yellow' : 'red')}`);
  console.log();
  
  // Statistics
  console.log(colorize('📈 Check Statistics:', 'bright'));
  console.log(`   Total Checks: ${assessment.summary.total}`);
  console.log(`   ${colorize('✅ Passed:', 'green')} ${assessment.summary.passed}`);
  console.log(`   ${colorize('❌ Failed:', 'red')} ${assessment.summary.failed}`);
  console.log(`   ${colorize('⚠️ Warnings:', 'yellow')} ${assessment.summary.warnings}`);
  console.log(`   ${colorize('🚨 Critical Issues:', 'red')} ${assessment.summary.critical}`);
  console.log();
  
  // Recommendations
  if (assessment.recommendations.length > 0) {
    console.log(colorize('💡 Key Recommendations:', 'bright'));
    assessment.recommendations.forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log();
  }
  
  // Next steps
  console.log(colorize('🚀 Next Steps:', 'bright'));
  
  if (assessment.overall === 'ready') {
    console.log('   ✅ System is ready for production deployment!');
    console.log('   📋 Review the deployment checklist in PRODUCTION_READINESS.md');
    console.log('   🚀 Proceed with deployment using ./deploy-threading.sh');
  } else if (assessment.overall === 'warning') {
    console.log('   ⚠️ System can be deployed but has warnings');
    console.log('   🔧 Address the recommendations above for optimal performance');
    console.log('   📋 Review failed checks and consider fixing before deployment');
  } else {
    console.log('   ❌ System is NOT ready for production deployment');
    console.log('   🔧 Fix all critical and error-level issues before deploying');
    console.log('   📋 Review the PRODUCTION_READINESS.md checklist');
  }
  
  console.log();
}

/**
 * Print checks by category
 */
function printChecksByCategory(checks: any[], category: string): void {
  const categoryChecks = checks.filter(check => check.category === category);
  
  if (categoryChecks.length === 0) {
    return;
  }
  
  printHeader(`${category.toUpperCase()} CHECKS`);
  
  categoryChecks.forEach(check => {
    printCheck(check);
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
  const withThreading = args.includes('--with-threading');
  
  console.log(colorize('🔍 MCP Threading System - Production Readiness Check', 'bright'));
  console.log(colorize('=' .repeat(60), 'blue'));
  
  // Initialize services
  const loggingService = new LoggingService({
    level: verbose ? 5 : 2, // DEBUG or INFO
    enableConsole: false, // We'll handle our own output
    enableFile: false
  });
  
  let threadingService: ThreadingService | undefined;
  
  if (withThreading) {
    console.log(colorize('🧵 Initializing threading service for comprehensive checks...', 'blue'));
    try {
      threadingService = new ThreadingService({}, loggingService.getWinstonLogger());
      const result = await threadingService.start();
      
      if (!result.success) {
        console.log(colorize('⚠️ Could not start threading service, running basic checks only', 'yellow'));
        threadingService = undefined;
      } else {
        console.log(colorize('✅ Threading service started successfully', 'green'));
      }
    } catch (error) {
      console.log(colorize('⚠️ Could not initialize threading service, running basic checks only', 'yellow'));
      threadingService = undefined;
    }
  }
  
  // Run checks
  const checker = new ProductionReadinessChecker(loggingService, threadingService);
  
  console.log(colorize('🔍 Running production readiness checks...', 'blue'));
  console.log();
  
  const assessment = await checker.runAllChecks();
  
  // Print results
  if (verbose) {
    const categories = ['system', 'security', 'configuration', 'performance', 'monitoring', 'threading'];
    
    categories.forEach(category => {
      if (!categoryFilter || categoryFilter === category) {
        printChecksByCategory(assessment.checks, category);
      }
    });
  } else {
    // Print only failed and critical checks
    const importantChecks = assessment.checks.filter(check => 
      check.status === CheckStatus.FAIL || 
      (check.severity === CheckSeverity.CRITICAL || check.severity === CheckSeverity.ERROR)
    );
    
    if (importantChecks.length > 0) {
      printHeader('IMPORTANT ISSUES');
      importantChecks.forEach(check => {
        printCheck(check);
      });
    }
  }
  
  // Print summary
  printSummary(assessment);
  
  // Cleanup
  if (threadingService) {
    try {
      await threadingService.stop();
      console.log(colorize('🧵 Threading service stopped', 'blue'));
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  // Exit with appropriate code
  if (assessment.overall === 'not_ready') {
    process.exit(1);
  } else if (assessment.overall === 'warning') {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

/**
 * Handle CLI arguments and help
 */
function printHelp(): void {
  console.log(`
${colorize('MCP Threading System - Production Readiness Check', 'bright')}

${colorize('Usage:', 'bright')}
  node readiness-check.js [options]

${colorize('Options:', 'bright')}
  -v, --verbose           Show detailed output for all checks
  --category=<name>       Filter checks by category (system, security, configuration, performance, monitoring, threading)
  --with-threading        Include threading service checks (requires system to be startable)
  -h, --help             Show this help message

${colorize('Examples:', 'bright')}
  node readiness-check.js                    # Run basic checks
  node readiness-check.js --verbose          # Show all check details
  node readiness-check.js --with-threading   # Include threading system checks
  node readiness-check.js --category=security # Show only security checks

${colorize('Exit Codes:', 'bright')}
  0 - System is ready for production
  1 - System is not ready (critical issues)
  2 - System has warnings but can be deployed

${colorize('Categories:', 'bright')}
  system        - Node.js version, memory, disk space, worker threads
  security      - Environment variables, secrets, passwords
  configuration - Required settings, threading config
  performance   - Memory limits, garbage collection
  monitoring    - Logging, health endpoints
  threading     - Threading service status, health monitoring
`);
}

// Handle CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  
  main().catch(error => {
    console.error(colorize('💥 Readiness check failed:', 'red'), error.message);
    process.exit(1);
  });
}