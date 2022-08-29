
const express = require('express');
const adminHelper = require('../helpers/admin-helper');
const router = express.Router();
const categoryHelper = require('../helpers/category-helper')
const productHelper = require('../helpers/product-helpers')
const adminController = require('../controller/admin-controller');
const { response } = require('express');
const sliderHelper = require('../helpers/slider-helper');
const multer = require('multer')

// set storage engine

const storage = multer.diskStorage({
  destination: "public/product-images",
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname);
  },
});

const uploads = multer({
  storage,
});

/* GET users listing. */

router.get('/', function (req, res, next) {
  if (req.session.admin) {
    res.render('admin/admin_dashbord', { dashbord: true, admin_header: true })
  } else {
    res.render('admin/admin_loging')
  }
});

// login

router.get('/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin/')
  } else {
    let session = req.session
    res.render('admin/admin_loging', { session })
    req.session.destroy()
  }
});

router.post('/login', (req, res) => {
  adminController.doLogin(req, res)
});

/////////////////////////////////////////////////// dashbord management //////////////////////////////////////////////////

// dash board

router.get('/dashbord', (req, res) => {
  res.render('admin/admin_dashbord', { dashbord: true, admin_header: true })
});


router.get('/chartData', async (req, res) => {
  let sales = await adminHelper.getDayWiseTotalSalesAmount();
  const category = await adminHelper.categoryWiseSaleCount()
  sales = sales.slice(-10);

  res.json({ sales: sales, category: category[0] });
})
router.get('/reportData', async (req, res) => {
  adminHelper.getReport().then((data) => {
    res.json(data)
  })

})

/////////////////////////////////////////////////// user management //////////////////////////////////////////////////

// view users

router.get('/users', (req, res) => {
  adminHelper.getAllUsers().then((users) => {
    res.render('admin/users', { users: true, admin_header: true, users })
  })
});

// Block User

router.get('/userblock/:id', (req, res, next) => {
  adminHelper.blockUser(req.params.id).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/users')
});

// Active User

router.get('/useractive/:id', (req, res, next) => {
  adminHelper.activeUser(req.params.id).catch((err) => {
    next(err)
  })
  res.redirect('/admin/users')
})

///////////////////////////////////////////////////  product management //////////////////////////////////////////////////

// view products

router.get('/viewproduct', (req, res) => {
  productHelper.getAllProduct().then((products) => {
    res.render('admin/view_product', { product: true, admin_header: true, products })
  })
});

// add product

router.get('/viewproduct/addproduct', async (req, res) => {
  let category = await categoryHelper.getAllCategory()
  res.render('admin/add_product', { product: true, admin_header: true, category })
});

router.post('/viewproduct/addproduct', uploads.array('image', 3), (req, res) => {
  const images = [];
  for (i = 0; i < req.files.length; i++) {
    images[i] = req.files[i].filename;
  }
  req.body.images = images;
  productHelper.addProduct(req.body).then((newProduct) => {
    res.redirect('/admin/viewproduct')
  })
});

// delete product

router.get('/delete-product/:id', (req, res, next) => {
  let proId = req.params.id;
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/viewproduct')
  }).catch((err) => {
    err.admin = true
    next(err)
  })
})

// edit product

router.get('/edit-product/:id', async (req, res, next) => {
  try {
    let category = await categoryHelper.getAllCategory()
    let product = await productHelper.getProductDetails(req.params.id)
    res.render('admin/edit_product', { admin_header: true, product, category })
  } catch (err) {
    err.admin = true
    next(err)
  }
});

router.post('/viewproduct/edit-product/:id', (req, res, next) => {
  productHelper.updateProduct(req.params.id, req.body).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/viewproduct');

});

// product details

router.get('/viewproduct/details/:id', (req, res, next) => {
  productHelper.getProduct(req.params.id).catch((err) => {
    err.admin = true
    next(err);
  }).then((details) => {
    res.render('admin/product-details', { admin_header: true, details })
  })
});

///////////////////////////////////////////////////  slider management //////////////////////////////////////////////////

// get slider

router.get('/slider', (req, res, next) => {
  sliderHelper.getAllSlider().then((sliders) => {
    res.render('admin/slider', { slider: true, admin_header: true, sliders })
  }).catch((err) => {
    next(err)
  })
});

// add slider

router.post('/slider/addslider', uploads.single("image"), (req, res) => {
  req.body.image = req.file.filename
  sliderHelper.addSlider(req.body).then((newSlider) => {
    res.redirect('/admin/slider')
  })
});

// delete slider

router.get('/delete-slider/:id', (req, res, next) => {
  let sliderId = req.params.id
  sliderHelper.deleteSlider(sliderId).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/slider')
});


///////////////////////////////////////////////////  category management //////////////////////////////////////////////////

// get category

router.get('/category', (req, res) => {
  categoryHelper.getAllCategory().then((categories) => {
    res.render('admin/category', { category: true, admin_header: true, categories })
  })
});

// add cetegory

router.post('/category/addcategory', uploads.single("image"), (req, res) => {
  req.body.image = req.file.filename;
  categoryHelper.addCategory(req.body).then((response) => {
    res.redirect('/admin/category')
  })
})

// delete category

router.get('/delete-category/:id', (req, res, next) => {
  let categoryId = req.params.id
  categoryHelper.deleteCategory(categoryId).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/category')
});

///////////////////////////////////////////////////  coupen management //////////////////////////////////////////////////

// get coupon
router.get('/coupon', (req, res) => {
  adminHelper.getCoupons().then((coupons) => {
    res.render('admin/coupon', { admin_header: true, coupon: true, coupons })
  })

})

router.post('/coupon/addcoupon', (req, res) => {
  adminHelper.addCoupon(req.body)
  res.redirect('/admin/coupon')
})

router.get('/coupon/delete-coupon/:id', (req, res, next) => {
  adminHelper.deleteCoupen(req.params.id).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/coupon')
})

router.post('/coupon/edit-coupon/:id', (req, res, next) => {
  adminHelper.editCoupon(req.body, req.params.id).catch((err) => {
    err.admin = true
    next(err)
  });
  res.redirect('/admin/coupon')
})

///////////////////////////////////////////////////  Order management //////////////////////////////////////////////////

// ger orders

router.get('/orders', (req, res) => {
  adminHelper.getOrders().then((orders) => {
    res.render('admin/orders', { admin_header: true, Orders: true, orders })
  })

})

// chenge status

router.get('/orders/change-status/:id', (req, res, next) => {
  adminHelper.changeStatus(req.params.id).catch((err) => {
    err.admin = true
    next(err)
  })
  res.redirect('/admin/orders')
})
// logout

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
})


module.exports = router;









// multer codes

// const storage = multer.diskStorage({
//   destination: './public/product-images',
//   filename: function (req, file, cb) {
//     console.log(file);
//     cb(null, file.fieldname + '-' + Date.now() + file.originalname);
//   }
// });

// const storage = multer.diskStorage({
//   destination: 'public/product-images',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + file.originalname);
//   }
// })

// init upload
// const upload = multer({
  // storage: storage,
  // limits:{fileSize:10},
  // fileFilter: function (req, file, cb) {
  //   checkFileType(file, cb)
  // }
// }).single('Image')


// //check file type
// function checkFileType(file, cb) {
  // const filetypes = /jpeg|jpg|png|gif/;
//   const extname = filetypes.test(path.extname
//     (file.originalname).toLowerCase());
//   //check tile
//   const mimetype = filetypes.test(file.mimetype);
//   if (mimetype && ext) {
//     return cb(null, true);
//   } else {
//     cb('Error:Image only')
//   }
// }