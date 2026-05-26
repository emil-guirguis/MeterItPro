Run commands
npm test - runs all 4 test suites in parallel
npm run test:client:api - client API only (73 tests)
npm run test:sync:api - sync API only (17 tests)
The existing client/frontend (256 passing) and sync/mcp (131 passing) suites have pre-existing failures unrelated to these changes.


Script	Runs
npm run test:client:frontend	client/frontend vitest
npm run test:client:api	client/api vitest
npm run test:sync:api	sync/api vitest
npm run test:sync:mcp	sync/mcp vitest


vitest --reporter=json

Test Report Options
Command	What it does
npm test	Runs all 4 projects via Vitest workspace, verbose console output
npm run test:report	Same + generates an HTML report at test-report/index.html
npm run test:all	Runs each project independently via concurrently

npm test 2>&1 &