const adminHelper = require('../helpers/admin-helper');

module.exports = {
  doLogin: (req, res) => {
    adminHelper.adminLogin(req.body).then((response) => {
      if (response.status) {
        req.session.admin = true
        req.session.admin = response.admin
        res.redirect('/admin/')
      }

    }).catch((status) => {
      if (status.invalidPassword) {
        req.session.invalidPassword = true
        res.redirect('/admin/login')
      } else {
        req.session.adminNotfound = true
        res.redirect('/admin/login')
      }
    })
  },

}