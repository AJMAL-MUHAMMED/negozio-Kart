
function addToCart(proId, productname) {
    $.ajax({
        url: '/addtocart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.quantityInc) {
                let count = $('#cartcount').html()
                count = parseInt(count) + 1
                $('#cartcount').html(count)
                swal(productname, "is Quantity increase !", "success")
                location.reload()
            } else if (response.PushedItem) {
                swal(productname, "is added to cart !", "success")
            } else if (response.addToCart) {
                swal(productname, "is added to cart !", "success")
            } else {
                location.href = ('/login')
            }
        },
        error: () => {
            location.href = ('/login')

        }
    })

};

// function deleteCartProduct(params, productname) {
//     $.ajax({
//         url: '/deleteCartProduct/' + params,
//         method: 'get',
//         success: (response) => {
//             if (response.removeProduct) {

//                 // swal(productname, "is Deleted from cart !", "error")
//                 location.reload()
//             }
//         },
//         error: () => {
//             location.href = ('/login')
//             swal("", "Please Longin..... !", "info")
//         }
//     })
// }

// const addToWishlist = async (proId) => {
//     await axios.post(`/addtowhishlist/${proId}`, {}).then(e => {
//         console.log(e.data);
//         // window.reload()
//     })
// }


