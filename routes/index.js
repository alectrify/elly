/* ---------- PACKAGES ---------- */
const express = require('express');

/* ---------- CONSTANTS ---------- */
const app = express();
const router = express.Router();

/* ---------- INITIALIZATION ---------- */
/* ----- EXPRESS ----- */


/* ---------- ROUTES ---------- */
router.get('/', (req, res) => {
    res.render('../views/index.ejs');
});

router.get('/records', (req, res) => {
    res.render('../views/records.ejs');
});

/* ---------- EXPORT ---------- */
module.exports = router;
