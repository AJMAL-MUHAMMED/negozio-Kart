
var db = require('../config/connection')
var collection = require('../config/collections');
const objectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const { resolve } = require('path');
const { log } = require('console');
const { response } = require('../app');

const env = require('dotenv').config()


var instance = new Razorpay({
    key_id: process.env.RAZOR_KEY,
    key_secret: process.env.RAZOR_SECRET,
});


const userHelpers = {
    checkUserExist: (userData) => {
        return new Promise((resolve, reject) => {
            userData.MobileNo = parseInt(userData.MobileNo)
            db.get().collection(collection.USER_COLLECTION).findOne({ MobileNo: userData.MobileNo }).then((status) => {
                if (status) {
                    resolve({ userAlreadyExist: true })
                } else {
                    db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email }).then((status2) => {
                        if (status2) {
                            resolve({ userAlreadyExist: true })
                        } else {
                            reject()
                        }
                    })
                }
            })
        })
    },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.MobileNo = parseInt(userData.MobileNo)
            userData.Password = await bcrypt.hash(userData.Password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne({ FullName: userData.FullName, Email: userData.Email, MobileNo: userData.MobileNo, Password: userData.Password, Active: true }).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let validStatus = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                if (user.Active) {
                    if (user) {
                        bcrypt.compare(userData.Password, user.Password).then((status) => {
                            if (status) {
                                response.user = user
                                response.status = true
                                resolve(response)
                            } else {
                                validStatus.invalidPassword = true
                                reject(validStatus)
                            }
                        })
                    } else {
                        validStatus.invalidUserid = true
                        reject(validStatus)
                    }
                } else {
                    response.userblocked = true
                    reject(response)
                }
            } else {
                resolve()
            }
        })
    },
    checkNumber: (body) => {
        let mob = parseInt(body.mob)
        return new Promise((resolve, reject) => {
            let response = {}
            db.get().collection(collection.USER_COLLECTION).findOne({ MobileNo: mob }).then((status) => {
                console.log(status);
                if (status) {
                    if (status.Active) {
                        resolve(status)
                    } else {
                        response.userblocked = true
                        reject(response)
                        console.log(response);
                    }
                } else {
                    response.invalidUserid = true
                    reject(response)
                }

            })
        })
    },
    getDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((data) => {
                resolve(data)
            })

        })
    },
    isBlocked: (user) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(user._id) }).then((data) => {
                if (data) {
                    if (data.Active) {
                        resolve()
                    } else {
                        reject()
                    }
                }
            })
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let userCart = await db.get().collection(collection.CART_COLLLECTION).findOne({ user: objectId(userId) })
                if (userCart) {
                    let proExist = userCart.products.findIndex(product => product.item == proId)
                    if (proExist != -1) {
                        db.get().collection(collection.CART_COLLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            response.quantityInc = true
                            resolve(response)
                        })
                    } else {
                        db.get().collection(collection.CART_COLLLECTION).updateOne({ user: objectId(userId) }, {
                            $push: {
                                products: proObj
                            }
                        }).then(() => {
                            response.PushedItem = true
                            resolve(response)
                        })
                    }
                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLLECTION).insertOne(cartObj).then(() => {
                        response.addToCart = true
                        resolve(response)
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    removeFromCart: (proId, userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CART_COLLLECTION).updateOne({ user: objectId(userId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } catch (err) {
                reject(err)
            }

        })
    },
    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let cartItems = await db.get().collection(collection.CART_COLLLECTION).aggregate(
                [
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'

                        }
                    },
                    {
                        //to change array product to object
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }

                ]).toArray()
            if (cartItems.length > 0) {
                response.cartItems = true
                response.cartItems = cartItems
                resolve(response)
            } else {
                response.cartEmpty = true
                resolve(response)
            }

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise(async (resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }

        })

    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLLECTION).aggregate(
                [
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        //to change array product to object
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {    //to find total amout
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                        }
                    }
                ]).toArray()
            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(00)

            }

        })
    },
    addToWishlist: (proId, userId) => {
        const response = {}
        return new Promise(async (resolve, reject) => {
            try {
                let ExistInCart = await db.get().collection(collection.CART_COLLLECTION).findOne({ user: objectId(userId), 'products.item': objectId(proId) })
                if (!ExistInCart) {
                    let WishExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ 'user': objectId(userId) })
                    let item = {
                        item: objectId(proId)
                    }
                    if (WishExist) {
                        let ProExist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ 'user': objectId(userId), 'products.item': objectId(proId) })
                        if (ProExist) {
                            response.proExist = true
                            resolve(response)
                        } else {
                            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, {
                                $push: { products: item }
                            })
                            response.pushedItem = true
                            resolve(response)
                        }
                    } else {
                        const whishlist = {
                            user: objectId(userId),
                            products: [item]
                        }
                        db.get().collection(collection.WISHLIST_COLLECTION).insertOne(whishlist).then(() => {
                            response.addToWishlist = true
                            resolve(response)
                        })
                    }
                } else {
                    response.existInCart = true
                    resolve(response)
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    wishProCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
            }

            resolve(count)
        })
    },
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate(
                [
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'

                        }
                    },
                    {
                        //to change array product to object
                        $project: {
                            price: 1, productname: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }

                ]).toArray()
            if (wishItems) {
                response.wishItems = true
                response.wishItems = wishItems
                resolve(response)
            } else {
                response.emptyWishlist = true
                resolve(response)
            }

        })

    },
    removeFromWishlist: (proId, userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(userDetails)
        })
    },
    userProfileEdit: (userId, userDetails) => {
        return new Promise(async (resolve, reject) => {
            try {

                db.get().collection(collection.USER_COLLECTION).updateMany({ _id: objectId(userId) }, {
                    $set: {
                        FullName: userDetails.FullName,
                        Email: userDetails.Email,
                        MobileNo: parseInt(userDetails.MobileNo)
                    }

                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    addAddress: (Data, userId) => {
        return new Promise(async (resolve, reject) => {
            Data.pincode = parseInt(Data.pincode)
            Data.mobileno = parseInt(Data.mobileno)
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne({ user: objectId(userId), Data }).then((response) => {
                resolve(response)
            })
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let Address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ user: objectId(userId) }).toArray()
            resolve(Address)
        })
    },
    deleteAddress: (addressId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: objectId(addressId) }).then((response) => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    updateAddress: (Id, detail) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objectId(Id) }, {
                    $set: {
                        'Data.fullname': detail.fullname,
                        'Data.landmark': detail.landmark,
                        'Data.city': detail.city,
                        'Data.pincode': detail.pincode,
                        'Data.mobileno': detail.mobileno,
                        'Data.address': detail.address
                    }
                }).then((response) => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    placeOrder: (order, products, totalPrice, userId, coupon, discount) => {
        return new Promise((resolve, reject) => {
            // console.log(order, products, totalPrice);
            order.subtotal = parseInt(order.subtotal)
            order.DDC = parseInt(order.DDC)
            order.grandtotal = parseInt(order.grandtotal)
            let status = order['payment-method'] === 'Cash On Delivery' ? 'placed' : 'pending'

            // split date and time
            let now = new Date()
            let date = now.toLocaleDateString();
            let time = now.toLocaleTimeString();

            let orderObj = {
                DeliveryAddress: order.addres,
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                subTotal: order.subtotal,
                DDC: order.DDC,
                discount: discount,
                grandTotal: order.grandtotal,
                status: status,
                date: date,
                time: time
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLLECTION).remove({ user: objectId(order.userId) })
                resolve(response.insertedId)
            })
            if (coupon) {
                // push user Id in array from coupon document
                db.get().collection(collection.COUPON_COLLECTION).updateOne({ couponCode: coupon.couponCode }, { $push: { 'users': objectId(userId) } })
            }
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            if (cart) {
                resolve(cart.products)
            } else {
                reject()
            }
        })

    },
    getUserOrders: (userid) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userid) }).toArray()
            resolve(orders)
        })
    },

    getOrderProducts: (orderId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id: objectId(orderId), userId: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'

                        }
                    },
                    {
                        //to change array product to object
                        $project: {
                            quantity: 1, item: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }

                ]).toArray()
                resolve(orderItems)
            } catch (err) {
                reject(err)
            }

        })
    },
    getGrandTotal: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }).then((data) => {
                resolve(data)
            })

        })
    },
    generateRazorpay: (orderId, GrandTotal) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: GrandTotal * 100,
                currency: "INR",
                receipt: "" + orderId,
            };
            instance.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err);
                } else {
                    resolve(order)
                }
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            var crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'QXvrdMJS9o3nNKRs2WdE3ZUK');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: { status: 'placed' }
            }).then(() => {
                resolve()
            })
        })
    },
    ApplyCoupon: (coupon, userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            response.discount = 0
            // coupon.couponCode = coupon.couponCode.toUpperCase();
            let couponData = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: coupon.couponCode })
            if (couponData) {
                let userExist = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: coupon.couponCode, users: { $in: [objectId(userId)] } })
                if (userExist) {
                    response.status = false
                    resolve(response)
                } else {
                    response.status = true
                    response.coupon = couponData
                    userHelpers.getTotalAmount(userId).then((total) => {
                        response.discount = total - ((total * couponData.discount) / 100)
                        response.discountPrice = (total * couponData.discount) / 100
                        resolve(response)
                    })
                }
            } else {
                response.status = false
                resolve(response)
            }
        })
    },
    getInvoice: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {

                let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate(
                    [
                        {
                            '$match': {
                                '_id': objectId(orderId)
                            }
                        },
                        {
                            '$unwind': {
                                'path': '$products'
                            }
                        }, {
                            '$lookup': {
                                'from': 'product',
                                'localField': 'products.item',
                                'foreignField': '_id',
                                'as': 'productDetails'
                            }
                        }, {
                            '$unwind': {
                                'path': '$productDetails'
                            }
                        }, {
                            '$project': {
                                '_id': 0,
                                'Address': '$DeliveryAddress',
                                'orderId': '$_id',
                                'Date': '$date',
                                'Time': '$time',
                                'ProductName': '$productDetails.productname',
                                'BrandName': '$productDetails.brandname',
                                'ProductPrice': '$productDetails.price',
                                'Quantity': '$products.quantity',
                                'Total': '$subTotal',
                                'Discount': '$discount',
                                'GrandTotal': '$grandTotal'
                            }
                        }
                    ]
                ).toArray()
                console.log(data)
                resolve(data[0])

            } catch (err) {
                reject(err);
            }
        })
    },
    orderCancel: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ORDER_COLLECTION).update({ _id: objectId(orderId) }, {
                    $set: { status: 'canceled' }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err);
            }
        })
    }
}


module.exports = userHelpers;