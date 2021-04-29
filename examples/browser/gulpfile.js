const { gulp, languages } = require('./gen-gulpfile');

// Do your gulpfile customization here.
// For example, call `languages.push({ folderName: 'jpn', id: 'ja' });` to add support for the Japanese locale.
// See https://github.com/microsoft/vscode-extension-samples/tree/main/i18n-sample for more implementation details.

languages.push({ folderName: 'jpn', id: 'ja' })

module.exports = { gulp, languages };
