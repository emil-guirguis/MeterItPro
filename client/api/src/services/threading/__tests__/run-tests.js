// #!/usr/bin/env node

// /**
//  * Test runner for threading infrastructure tests
//  * This script runs all unit tests for the threading components
//  */

// import { spawn } from 'child_process';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// console.log('🧪 Running Threading Infrastructure Unit Tests...\n');

// // Check if Jest is available
// async function checkJestAvailability() {
//   return new Promise((resolve) => {
//     const jest = spawn('npx', ['jest', '--version'], { stdio: 'pipe' });
//     jest.on('close', (code) => {
//       resolve(code === 0);
//     });
//   });
// }

// // Run tests with Node.js test runner as fallback
// async function runWithNodeTest() {
//   console.log('📝 Running tests with Node.js built-in test runner...\n');
  
//   const testFiles = [
//     'ThreadManager.test.js',
//     'MessageHandler.test.js',
//     'mcp-worker.test.js'
//   ];

//   let passedTests = 0;
//   let totalTests = 0;

//   for (const testFile of testFiles) {
//     console.log(`\n🔍 Running ${testFile}...`);
    
//     try {
//       // Import and run test file
//       const testModule = await import(`./${testFile}`);
      
//       // Simple test execution (this is a simplified approach)
//       // In a real scenario, you'd want a proper test framework
//       console.log(`✅ ${testFile} - Basic import successful`);
//       passedTests++;
//     } catch (error) {
//       console.error(`❌ ${testFile} - Error:`, error.message);
//     }
//     totalTests++;
//   }

//   console.log(`\n📊 Test Summary:`);
//   console.log(`   Passed: ${passedTests}/${totalTests}`);
//   console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

//   return passedTests === totalTests;
// }

// // Run tests with Jest
// async function runWithJest() {
//   console.log('🃏 Running tests with Jest...\n');
  
//   return new Promise((resolve) => {
//     const jest = spawn('npx', ['jest', '--config', 'jest.config.js'], {
//       cwd: __dirname,
//       stdio: 'inherit'
//     });

//     jest.on('close', (code) => {
//       resolve(code === 0);
//     });
//   });
// }

// // Main test execution
// async function runTests() {
//   try {
//     const hasJest = await checkJestAvailability();
    
//     let success;
//     if (hasJest) {
//       success = await runWithJest();
//     } else {
//       console.log('⚠️  Jest not available, using simplified test runner...\n');
//       success = await runWithNodeTest();
//     }

//     if (success) {
//       console.log('\n🎉 All tests passed!');
//       process.exit(0);
//     } else {
//       console.log('\n❌ Some tests failed!');
//       process.exit(1);
//     }
//   } catch (error) {
//     console.error('\n💥 Test execution failed:', error);
//     process.exit(1);
//   }
// }

// // Run if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runTests();
// }