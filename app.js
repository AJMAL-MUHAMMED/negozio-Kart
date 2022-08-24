let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const nocache = require('nocache')
const hbs = require('express-handlebars')
// const fileUpload = require('express-fileUpload') 
const db = require('./config/connection')
const session = require('express-session')
const Handlebars = require('handlebars')

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const app = express();

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', defaultLayout: 'layout',
  layoutDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  helpers: {
    total: (quant, price) => {
      return quant * price;
    },
    overTotal: (subtotal, shipFee, discount) => {
      return (subtotal + shipFee) - discount
    },
    add: (subtotal, shipfee, discount) => {
      return (subtotal + shipfee) - discount
    },
    order: (orderid) => {
      let data = orderid + "";
      return data.slice(4, 9)
    },
    Gt: (sub, ship) => {
      return sub + ship
    },
    isEqual: (a, b, options) => {
      if (a == b) {
        return options.fn(this)
      }
      return options.inverse(this)
    },
    eq: function (a, b) {
      if (a === b)
        return true
      else
        return false
    },
    handlebars: allowInsecurePrototypeAccess(Handlebars)
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())


const MemoryStore = session.MemoryStore;
app.use(session({
  name: 'app.sid',
  secret: '1234567890QWERTY',
  resave: true,
  store: new MemoryStore(),
  saveUninitialized: true,
  cookie: { maxAge: 6000000 }
}));

app.use(nocache())


db.connect((err) => {
  if (err)
    console.log('connection error' + err);
  else
    console.log("db connected");
})


// check user blocked

const userHelper = require('./helpers/user-helpers')
const isBlocked = (req, res, next) => {
  if (req.session.user) {
    userHelper.isBlocked(req.session.user).then((yes) => {
      next();
    }).catch((no) => {
      req.session.user = null;
      req.session.userblocked = true
      res.redirect('/login/')
    })
  } else {
    next();
  }
}



app.use('/', isBlocked, userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { err });
});

module.exports = app;
