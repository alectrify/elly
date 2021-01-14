/* ---------- PACKAGES ---------- */
const express = require('express');
const fs = require('fs');
const path = require('path');

/* ---------- CONSTANTS ---------- */
const app = express();
const port = process.env.PORT || 3000;

/* ---------- INITIALIZATION ---------- */
/* ----- EXPRESS ----- */
app.use(express.static(path.join(__dirname, 'public')));

/* ----- MULTER ----- */
/* --- Removing existing files in /temp --- */
const tempPath = path.join(__dirname, 'temp');

fs.readdir(tempPath, (err, fileNames) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    fileNames.forEach((fileName) => {
        fs.unlink(path.join('temp', fileName), (err) => {
           if (err) throw err;

           console.log(`temp/${fileName} was deleted`);
        });
    });
});

/* ---------- ROUTES ---------- */
app.use('/', require('./routes/index.js'));
app.use('/api', require('./routes/api.js'));

app.get('*', (req, res) => {
    res.send('Error Page');
});

/* ---------- LAUNCH ---------- */
app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/`);
});