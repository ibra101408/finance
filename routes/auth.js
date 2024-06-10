const express = require('express')
const passport = require('passport')
const router = express.Router()


router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }) );


router.get(
    '/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    }),
    (req, res, next) => {
        res.redirect('/log')
    }
)

router.get('/google/success', (req, res) => {
    res.redirect('/log'); // You can render a success page or perform any other action here
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        console.log("logout");
        res.redirect('/');
    });
});

module.exports = router;