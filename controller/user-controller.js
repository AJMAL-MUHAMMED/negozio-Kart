
const { response } = require('express')
var userHelpers = require('../helpers/user-helpers')
module.exports = {
    doLogin: (req, res) => {
        userHelpers.doLogin(req.body).then((response) => {
            if (response.status) {
                req.session.user = true
                req.session.user = response.user
                res.redirect('/')
            }
        }).catch((status) => {
            if (status.invalidPassword) {
                req.session.invalidPassword = true
                res.redirect('/login')
            }
            else if (status.userblocked) {
                req.session.userblocked = true
                res.redirect('/login')
            } else {
                req.session.invalidUserid = true
                res.redirect('/login')
            }
        })


    },
    // doSignup: (req, res) => {
    //     userHelpers.doSignup(req.body).then(async (response) => {
    //         console.log(response);
    //         if (response.userNotfound) {
    //             let user = await userHelpers.getDetails(response.user.insertedId)
    //             req.session.user = user
    //             res.redirect('/')
    //         }
    //     }).catch((response) => {
    //         if (response.userexist) {
    //             req.session.userAlreadyExist = true
    //             let session = req.session
    //             res.render('user/user_register', { session })
    //         }

    //     })
    // },
    doSignup: (req, res) => {
        userHelpers.checkUserExist(req.body).then((yes) => {
            req.session.userAlreadyExist = true
            res.redirect('/sign-up')
        }).catch(() => {
            res.redirect('/otp-verification')
        })
    }
}