/* ---------- PACKAGES ---------- */
const express = require('express');

/* ---------- CONSTANTS ---------- */
const router = express.Router();

/* ---------- INITIALIZATION ---------- */
/* ----- EXPRESS ----- */


/* ---------- ROUTES ---------- */
router.get('/', (req, res) => {
    res.render('../views/index.ejs');
});

router.get('/edit/:id/:batch/:page', (req, res) => {
    res.render('../views/edit.ejs');
});

router.get("/photo-scan", (req, res) => {
    res.render("../views/photo-scan.ejs");
});

router.get('/records', (req, res) => {
    res.render('../views/records.ejs');
});

/* ---------- EXPORT ---------- */
module.exports = router;
