const axios = require("axios");
const Razorpay = require("razorpay");


const RPcreateOrder = async (body) => {
    var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    try{
        var order =  await instance.orders.create(body)
        if(order){
            console.log(order);
            return order;
        }
    }
    catch(err){
        console.log(err);
    }
    
}


const RPcheckStatus = async (orderId) => {
    var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    try{
        var order =  instance.orders.fetch(orderId)
        if(order){
            console.log(order);
            return order;
        }
    }
    catch(err){
        console.log(err);
    }
}

module.exports = { RPcreateOrder, RPcheckStatus };