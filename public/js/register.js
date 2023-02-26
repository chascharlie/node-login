let session = document.cookie.split("; ").find((row) => row.startsWith("session=")) ?.split("=")[1]; // Get session ID
if (session) {
    location.href = "main.html";
}

$('form').submit((e) => {
    e.preventDefault() // Disable default behaviour of form submitting; this prevents the page refreshing and code failing to run

    // Send POST request to /register
    $.post({
        url: "/register",
        // Include data from form
        data: {
            firstname: $('.first-name').val(),
            lastname: $('.last-name').val(),
            email: $('.email').val(),
            password: $('.password').val(),
        },
        // When response received
        success: (res) => {
            if (res['success']) { // If request succeeded
                location.href = "login.html"; // Go to login page
            }
            else { // If request failed
                let err = res['msg']; // Get message from response
                $('.err-msg').show(); // Show err-msg element
                $('.err-msg').html(err); // Change contents of err-msg to message
            }
        }
    });
});