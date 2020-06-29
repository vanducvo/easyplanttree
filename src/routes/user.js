const express = require("express");
const router = express.Router();
const Token = require("../models/token");
const { docs } = require("googleapis/build/src/apis/docs");

router.get('/', function(req, res){
    Token
    .find({user: req.user.id})
    .select({
        browser: 1,
        ip: 1
    })
    .exec()
    .then(docs => {
        console.log(docs);
        return res.render("pages/user.ejs", {
            _csrf: req.csrfToken(),
            user: req.user,
            sessions: docs
        });
    })
});

module.exports = router;