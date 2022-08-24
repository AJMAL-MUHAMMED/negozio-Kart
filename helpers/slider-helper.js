
const db = require('../config/connection')
const collection = require('../config/collections');
const objectId = require('mongodb').ObjectId;
const fs = require('fs');


module.exports = {
    addSlider: (items) => {
        return new Promise(async (resolve, reject) => {
            let newSlider = await db.get().collection(collection.SLIDER_COLLECTION).insertOne(items)
            resolve(newSlider)
        })
    },
    getAllSlider: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SLIDER_COLLECTION).find().toArray().then(sliders => {
                resolve(sliders)
            })

        })
    },
    deleteSlider: (Id) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.SLIDER_COLLECTION).findOne({ _id: objectId(Id) }).then((response) => {
                    if (fs.existsSync('public/product-images/' + response.image)) {
                        fs.unlink('public/product-images/' + response.image, () => { })
                    }
                })
                db.get().collection(collection.SLIDER_COLLECTION).deleteOne({ _id: objectId(Id) }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }

        })
    }
}