var scrl = " Tattle Talk ";
function scrlsts() {
    scrl = scrl.substring(1, scrl.length) + scrl.substring(0, 1);
    document.title = scrl;
    setTimeout("scrlsts()", 300);
}

//login menu functionality
$('.message a').click(function(){
    $('form, .social-buttons, .form-line').animate({height: "toggle", opacity: "toggle"}, "slow");
});

//fb button functionality
$('#fb-btn').click(function(){
    window.location.replace('/login/auth/fb');
});

//google button functionality
$('#g-btn').click(function(){
    window.location.replace('/login/auth/google');
});

$('#msg_button').click(function () {
    window.location.replace('/chat');
});


$('#group_btn').click(function () {
    window.location.replace('/group');
});

$('#private_chat').click(function () {
    window.location.replace('http://localhost:3000/chat');
});
