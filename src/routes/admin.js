const express = require('express');
const router = express.Router();

router.get('/', function(req, res){
    res.render('pages/admin.ejs', {_csrf: req.csrfToken()});
});


module.exports = router;