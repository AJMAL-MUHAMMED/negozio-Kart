var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
const objectId = require('mongodb').ObjectId;
const fs = require('fs');


module.exports = {
    addCategory: (items) => {
        console.log(items);
        items.category = items.category.toUpperCase()
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: items.category });
            const response = {}
            if (!category) {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(items)
                response.category = true
                resolve(response)
            } else {
                response.categoryExist = true
                resolve(response)
            }

        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },
    deleteCategory: (Id) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(Id) }).then((response) => {
                    if (fs.existsSync('public/product-images/' + response.image)) {
                        fs.unlink('public/product-images/' + response.image, () => { })
                    }
                })
                db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(Id) }).then((response) => {
                    resolve(response)
                })

            } catch (err) {
                reject(err)
            }

        })
    }



}