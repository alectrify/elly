//Document loaded 
$(document).ready(() => {
    $(".payment_btn").click(() => {
        purchaseClicked();
    });

});

//Stripe config
let stripeHandler = StripeCheckout.configure({
    key: 'pk_test_51HcMe8In4qQnBeOS8iq89uWmwXBD4wb3ZdKhnYbrnzu8qjxO9j9aKHFVArCXGlFF716ULuzpwS6x0MnLnOpgdzOP00gKhJomob', 
    locale: "auto", 
    token: function(token){
        console.log(token);
    }
})

//Helper functions
function purchaseClicked(){
    stripeHandler.open({
        amount: 2
    })
}
