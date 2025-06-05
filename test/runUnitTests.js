const Mocha = require('mocha');
const path = require('path');

// Create the mocha test runner
const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 5000
});

// Add our unit test files
mocha.addFile(path.resolve(__dirname, '../out/test/unit/ContextRetrievalEngine.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/ContextIntegration.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/AdvancedContextFilter.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/CodeSnippetsLibrary.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/FileTreeManipulator.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/AdvancedPluginSystem.unit.test.js'));
mocha.addFile(path.resolve(__dirname, '../out/test/unit/AuditLoggingSystem.unit.test.js'));

// Run the tests
console.log('Running Cuovare Complete Unit Test Suite (v0.7.0 + v0.8.0)...\n');

mocha.run(failures => {
    if (failures > 0) {
        console.error(`\n❌ ${failures} test(s) failed`);
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
});
