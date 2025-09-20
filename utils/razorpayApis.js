const axios = require("axios");
const Razorpay = require("razorpay");


const RPcreateOrder = async (body, split) => {
    var key_id;
    if(split){
        key_id = process.env.RAZORPAY_KEY_ID_TN_TEST;
        key_secret = process.env.RAZORPAY_KEY_SECRET_TN_TEST;
    }
    else{
        key_id = process.env.RAZORPAY_KEY_ID;
        key_secret = process.env.RAZORPAY_KEY_SECRET;
    }
    var instance = new Razorpay({ key_id, key_secret });
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


const RPcheckStatus = async (orderId ,split) => {
    var key_id;
    if(split){
        key_id = process.env.RAZORPAY_KEY_ID_TN_TEST;
        key_secret = process.env.RAZORPAY_KEY_SECRET_TN_TEST;
    }
    else{
        key_id = process.env.RAZORPAY_KEY_ID;
        key_secret = process.env.RAZORPAY_KEY_SECRET;
    }
    var instance = new Razorpay({ key_id, key_secret });
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