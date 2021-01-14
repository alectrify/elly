const path = require('path');

module.exports = {
    entry: './src/bundle.js',
    mode: 'production',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public', 'scripts'),
    },
};