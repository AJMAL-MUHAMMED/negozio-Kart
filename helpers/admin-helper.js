var db = require('../config/connection')
var collection = require('../config/collections');
const objectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const { response } = require('../app');
const { COUPON_COLLECTION } = require('../config/collections');



module.exports = {
    adminLogin: (adminLogin) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let validStatus = {}

            // adminLogin.Password = await bcrypt.hash(adminLogin.Password, 10)
            // db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminLogin).then(()=>{})

            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminLogin.Email })
            if (admin) {
                bcrypt.compare(adminLogin.Password, admin.Password).then((status) => {
                    if (status) {
                        response.status = true
                        response.admin = admin
                        resolve(response)
                    } else {
                        validStatus.invalidPassword = true
                        reject(response)
                    }
                })
            } else {
                validStatus.adminNotfound = true
                reject(response)
            }
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $set: { Active: false }
                }).then(() => {
                    resolve(true)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    activeUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $set: { Active: true }
                }).then(() => {
                    resolve(true)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    addCoupon: (details) => {
        return new Promise((resolve, reject) => {
            details.discount = parseInt(details.discount),
                // details.couponCode = details.couponCode.toUpperCase()
                db.get().collection(collection.COUPON_COLLECTION).insertOne(details).then((response) => {
                    resolve(response)
                })
        })
    },
    getCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    deleteCoupen: (couponId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err);
            }
        })
    },
    editCoupon: (data, couponId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: objectId(couponId) }, {
                    $set: {
                        couponId: data.couponId,
                        couponCode: data.couponCode,
                        description: data.description,
                        discount: data.discount
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }

        })
    },
    getOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    changeStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: { status: 'shipped' }
                }).then((response) => { resolve() });
            } catch (err) {
                reject(err);
            }

        })
    }
}