
var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
var userController = require('../controller/user-controller');
const sliderHelper = require('../helpers/slider-helper');
const categoryHelper = require('../helpers/category-helper');
const authentication = require('../authentication/otpVerification');
const { response } = require('../app');
const { get } = require('mongoose');
const { log } = require('handlebars');

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */

router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  let products = await productHelper.getAllProduct().catch((err) => {
    next(err)
  })
  let slider = await sliderHelper.getAllSlider()
  let categories = await categoryHelper.getAllCategory()
  res.render('user/user_home', {
    user_header: true, user_footer: true,
    user, slider, products, categories, cartItems, cartEmpty, cartCount, totalValue, wishProCount
  });
});


//login

router.post('/login', (req, res) => {
  userController.doLogin(req, res)
});

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    let session = req.session
    res.render('user/user_login', { session });
    req.session.destroy()
  }
});

//sign up

router.get('/sign-up', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    let session = req.session
    res.render('user/user_register', { session })
  }
});

router.post('/sign-up', (req, res, next) => {
  req.session.tempData = req.body
  userController.doSignup(req, res)
});

/////////////////////////////////////////////////// Otp verification //////////////////////////////////////////////////

//otp verification sign Up

router.get('/otp-verification', (req, res) => {
  // res.render('user/otp_page')
  if (req.session.user) {
    res.redirect('/');
  } else if (req.session.wrongOtp) {
    res.render('user/otp_page', { number: req.session.tempData.MobileNo, wrong: 'Wrong Otp' })
  } else {
    authentication.getOtp(req.session.tempData.MobileNo).then(() => {
    })
    res.render('user/otp_page', { number: req.session.tempData.MobileNo })
  }
});

// otp check
router.post('/otp-verify', (req, res) => {
  authentication.checkOtp(req.body.otp, req.session.tempData.MobileNo).then((status) => {
    if (status == 'approved') {
      userHelpers.doSignup(req.session.tempData).then((data) => {
        req.session.user = req.session.tempData;
        req.session.user._id = data.insertedId;
        res.redirect('/')
      })
    } else {
      req.session.wrongOtp = true
      res.redirect('/otp-verification');
    }
  })
})

// otp send in singn in

router.post('/login/otp-send', (req, res) => {

  userHelpers.checkNumber(req.body).then((user) => {
    req.session.mob = parseInt(req.body.mob)
    req.session.tempUser = user;
    authentication.getOtp(req.body.mob)
    res.render('user/otp-signin', { number: req.body.mob })
  }).catch((response) => {
    if (response.invalidUserid) {
      req.session.invalidUserid = true
      res.redirect('/login')
    } else {
      req.session.userblocked = true
      res.redirect('/login')
    }

  })
})

// otp verification in sign In

router.post('/otp-with-signin', (req, res) => {
  authentication.checkOtp(req.body.otp, req.session.mob).then((status) => {
    if (status == 'approved') {
      req.session.user = req.session.tempUser;
      res.redirect('/')
    } else {
      req.session.wrongOtp = true
      res.render('user/otp-signin', { wrongOtp: 'wrongOtp' })
    }
  })
})

/////////////////////////////////////////////////// Contact and About Session //////////////////////////////////////////////////

router.get('/contact', async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  res.render('user/contact', { user_header: true, user_footer: true, cartItems, cartEmpty, cartCount, totalValue, wishProCount })
})


router.get('/about', async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  res.render('user/about', { user_header: true, user_footer: true, cartItems, cartEmpty, cartCount, totalValue, wishProCount })
})

/////////////////////////////////////////////////// Address management //////////////////////////////////////////////////

// address post

router.post('/address/addaddress', verifyLogin, (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id)
  res.redirect('/userprofile')
});

// address delete 

router.get('/userprofile/deleteaddress/:id', (req, res, next) => {
  userHelpers.deleteAddress(req.params.id,).catch((err) => {
    next(err)
  })
  res.redirect('/userprofile')
});

// address edit

router.post('/userprofile/editaddress/:id', (req, res, next) => {
  userHelpers.updateAddress(req.params.id, req.body).catch((err) => {
    next(err)
  })
  res.redirect('/userprofile')
})

// add address in checkout page

router.post('/proceed-to-checkout/Add', verifyLogin, (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id)
  res.redirect('/proceed-to-checkout')
})

/////////////////////////////////////////////////// User Profile //////////////////////////////////////////////////

//user profile

router.get('/userprofile', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
    let address = await userHelpers.getAddress(req.session.user._id)
    let addressEdit = await userHelpers.getAddress(req.session.user._id)
    let userDetails = await userHelpers.getUserDetails(req.session.user._id)
    res.render('user/user-profile', { user_header: true, cartItems, cartEmpty, cartCount, totalValue, wishProCount, user, userDetails, address, addressEdit })
  }
});

// edit profile

router.post('/userprofile/editprofile/:id', verifyLogin, (req, res, next) => {
  userHelpers.userProfileEdit(req.params.id, req.body).catch((err) => {
    next(err)
  })
  res.redirect('/userprofile')
  // res.json({status:true})
})

router.get('/userprofile/vieworders', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user_header: true, user_footer: true, user, orders, cartItems, cartEmpty, cartCount, totalValue, wishProCount })
})

router.get('/userprofile/vieworders/order-cancel/:id', (req, res, next) => {
  userHelpers.orderCancel(req.params.id).catch((err) => {
    next(err)
  })
  res.redirect('/userprofile/vieworders')
})

/////////////////////////////////////////////////// Products //////////////////////////////////////////////////

// products

router.get('/products', async (req, res, next) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  let products = await productHelper.getAllProduct().catch((err) => {
    next(err)
  })
  res.render('user/product', { user_header: true, user_footer: true, user, products, cartEmpty, cartItems, cartCount, totalValue, wishProCount })
});

router.get('/productdetails/:id', async (req, res, next) => {
  let productdetails = await productHelper.findProduct(req.params.id).catch((err) => {
    next(err)
  })
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  res.render('user/product-details', { user_header: true,  user,  cartEmpty, cartItems, cartCount, totalValue, wishProCount, productdetails })
});

/////////////////////////////////////////////////// whishlist //////////////////////////////////////////////////

// view  whish list

router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  let products = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    products = await userHelpers.getWishlistProducts(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  wishItems = products.wishItems
  emptyWishlist = products.emptyWishlist

  res.render('user/wishlist', { user_header: true, user_footer: true, user, emptyWishlist, wishItems, cartItems, cartEmpty, cartCount, totalValue, wishProCount })

})

// add wishlist

router.post('/addtowishlist/:id', verifyLogin, (req, res, next) => {
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((err) => {
    next(err)
  })
})

// delete form whishlist

router.get('/delete-wish-product/:id', (req, res, next) => {
  userHelpers.removeFromWishlist(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((err) => {
    next(err)
  })
})

/////////////////////////////////////////////////// cart management //////////////////////////////////////////////////

// view shopin cart

router.get('/shoping-cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
  }

  req.session.discount = null
  // let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  userHelpers.getCartProduct(req.session.user._id).then((response) => {
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
    res.render('user/shoping-cart', {
      user_header: true, user_footer: true,
      user: req.session.user, cartItems, cartEmpty, cartCount, totalValue, wishProCount
    })
  })
});

//  add to cart

router.get('/addtocart/:id', (req, res, next) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((err) => {
    next(err)
  })
})

// delete from cart

router.get('/delete-cart-product/:id', (req, res, next) => {
  userHelpers.removeFromCart(req.params.id, req.session.user._id).then((response) => {
    res.json(response)
  }).catch((err) => {
    next(err)
  })
})

//change Quantity

router.post('/change-quantity', verifyLogin, (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user).then(() => { })
    res.json(response)
  })
})

/////////////////////////////////////////////////// coupon  ///////////////////////////////////////////////////////////

router.post('/apply-coupon', verifyLogin, (req, res) => {
  userHelpers.ApplyCoupon(req.body, req.session.user._id).then((response) => {
    if (response.status) {
      req.session.coupon = response.coupon
      req.session.discount = response.discountPrice
      // req.session.response = response
    }
    res.json(response)
  })

})

/////////////////////////////////////////////////// Place order and ckeckout //////////////////////////////////////////////////

// proceed to checkout

router.get('/proceed-to-checkout', verifyLogin, async (req, res) => {
  let address = await userHelpers.getAddress(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  let response = await userHelpers.getCartProduct(req.session.user._id)
  let products = response.cartItems
  res.render('user/checkout', { user: req.session.user, address, products, totalValue, coupon: req.session.discount })
});

// return to shoping cart from checkout page

router.get('/proceed-to-checkout/shoping-cart', (req, res) => {
  res.redirect('/shoping-cart')
});

// place oruder

router.post('/place-order', async (req, res, next) => {
  try {
    let products = await userHelpers.getCartProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body, products, totalPrice, req.body.userId, req.session.coupon, req.session.discount).then(async (orderId) => {
      req.session.orderId = orderId
      let GrandTotal = await userHelpers.getGrandTotal(orderId)
      req.session.order = GrandTotal
      if (req.body['payment-method'] === 'Cash On Delivery') {
        res.json({ Cash_On_Delivery: true, orderId })
      } else {
        userHelpers.generateRazorpay(orderId, GrandTotal.grandTotal).then((response) => {
          res.json(response)
        })
      }
    })
  } catch (err) {
    next(err)
  }

});

// orde success

router.get('/order-success', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  res.render('user/order-success', { user_header: true, user_footer: true, user, cartItems, cartEmpty, cartCount, totalValue, wishProCount, order: req.session.order })
})

// get orders

router.get('/order-success/orders', verifyLogin, async (req, res) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user_header: true, user_footer: true, user, orders, cartItems, cartEmpty, cartCount, totalValue, wishProCount })
})

// view order products

router.get('/orders/view-order-products/:id', async (req, res, next) => {
  let user = req.session.user
  let cartItems = null
  let cartEmpty = null
  let cartCount = null
  let totalValue = null
  let wishProCount = null
  let products = null
  if (req.session.user) {
    totalValue = await userHelpers.getTotalAmount(user._id)
    const response = await userHelpers.getCartProduct(user._id);
    cartCount = await userHelpers.getCartCount(user._id);
    wishProCount = await userHelpers.wishProCount(user._id)
    products = await userHelpers.getOrderProducts(req.params.id, user._id).catch((err) => {
      next(err)
    })
    cartItems = response.cartItems
    cartEmpty = response.cartEmpty
  }
  res.render('user/view-order-products', { products, user_header: false, user_footer: false, user, cartItems, cartEmpty, cartCount, totalValue, wishProCount })
});

router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ status: true })
    }).catch((err) => {
      console.log(err);
      res.json({ status: false, err: '' })
    })
  })
})
/////////////////////////////////////////////////// invoice //////////////////////////////////////////////////

router.get('/userprofile/vieworders/invoice-download/:id', (req, res, next) => {
  userHelpers.getInvoice(req.params.id).then((data) => {
    console.log(data + "   then")
    res.render('user/invoice', { data })
  }).catch((err) => {
    next(err)
  })
})
/////////////////////////////////////////////////// logout //////////////////////////////////////////////////

//logout

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})
router.get('/userprofile/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

module.exports = router;
