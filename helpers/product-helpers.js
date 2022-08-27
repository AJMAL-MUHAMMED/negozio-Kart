
var db = require('../config/connection')
var collection = require('../config/collections');
const objectId = require('mongodb').ObjectId;
const fs = require('fs');
const { errorMonitor } = require('events');


module.exports = {

    addProduct: (product) => {
        return new Promise(async (resolve, reject) => {
            product.price = parseInt(product.price);
            product.discountprice = parseInt(product.discountprice);
            product.unitsinstock = parseInt(product.unitsinstock);

            let now = new Date()
            let date = now.toLocaleDateString();
            product.date = date

            let newProduct = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product)
            resolve(newProduct)
        })
    },
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (err) {
                reject(err)
            }
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((response) => {
                    response.images.forEach(image => {
                        if (fs.existsSync('public/product-images/' + image)) {
                            fs.unlink('public/product-images/' + image, () => { })
                        }
                    });
                })
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
                    resolve(response)
                })
                // delete product from cart of all users
                db.get().collection(collection.CART_COLLLECTION).updateOne({},
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }
                ).then((res) => {
                    resolve(res)
                })
                // delete product from wishlist of all users
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({},
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }
                ).then((resp) => {
                    resolve(resp)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    getProduct: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }

        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },
    updateProduct: (proId, productDetails) => {
        return new Promise((resolve, reject) => {
            try {
                productDetails.price = parseInt(productDetails.price);
                productDetails.discountprice = parseInt(productDetails.discountprice);
                productDetails.unitsinstock = parseInt(productDetails.unitsinstock);
                let now = new Date()
                let date = now.toLocaleDateString();
                productDetails.date = date
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        productname: productDetails.productname,
                        brandname: productDetails.brandname,
                        price: productDetails.price,
                        discountprice: productDetails.discountprice,
                        description: productDetails.description,
                        category: productDetails.category,
                        size: productDetails.size,
                        unitsinstock: productDetails.unitsinstock,
                        date: productDetails.date

                    }
                }).then((response) => {
                    resolve()
                })
                // if (fs.existsSync('public/product-images/' + image)) {
                //     fs.rename('public/product-images/' + image, () => { })
                // }

            } catch (err) {
                reject(err)
            }

        })
    },
    findProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let dt = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) })
                resolve(dt)
            } catch (err) {
                reject(err)
            }


        })
    },


}