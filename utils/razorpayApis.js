const axios = require("axios");
const Razorpay = require("razorpay");


const RPcreateOrder = async (body, split) => {
    var key_id;
    console.log("Body",body)
    console.log("create Order");
    if(split){
        console.log("Using test keys - TN");
        
        key_id = process.env.RAZORPAY_KEY_ID_TN_TEST;
        key_secret = process.env.RAZORPAY_KEY_SECRET_TN_TEST;
        console.log("Keys - TN", key_id, key_secret);
    }
    else{
        console.log("Using test keys - NOT TN");
        key_id = process.env.RAZORPAY_KEY_ID;
        key_secret = process.env.RAZORPAY_KEY_SECRET;
        console.log("Keys - NOT TN", key_id, key_secret);
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
    console.log("OrderId", orderId);
    if(split){
        console.log("Using test keys - TN");

        key_id = process.env.RAZORPAY_KEY_ID_TN_TEST;
        key_secret = process.env.RAZORPAY_KEY_SECRET_TN_TEST;
        console.log("Keys - TN", key_id, key_secret);
    }
    else{
        console.log("Using test keys - NOT TN");
        key_id = process.env.RAZORPAY_KEY_ID;
        key_secret = process.env.RAZORPAY_KEY_SECRET;
        console.log("Keys - NOT TN", key_id, key_secret);
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