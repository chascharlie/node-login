let session = document.cookie.split("; ").find((row) => row.startsWith("session=")) ?.split("=")[1]; // Get session ID
if (session) {
    location.href = "main.html";
}

$('form').submit((e) => {
    e.preventDefault() // Disable default behaviour of form submitting; this prevents the page refreshing and code failing to run

    // Send POST request to /register
    $.post({
        url: "/login",
        // Include data from form
        data: {
            email: $('.email').val(),
            password: $('.password').val(),
        },
        // When response received
        success: (res) => {
            if (res['success']) { // If request succeeded
                let session = res['session']; // Get session ID
                if ($('.remember-me').is(':checked')) { // If remember me checked
                    // Set cookie to expire in a year from now
                    var expireDate = new Date();
                    expireDate.setFullYear(expireDate.getFullYear() + 1);
                    document.cookie = `session=${session}; expires=${expireDate.toUTCString()}; path=/`
                }
                else {
                    // Set cookie to expire when the browser is closed
                    document.cookie = `session=${session}; path=/`
                }
                location.href = "main.html"; // Go to main page
            }
            else { // If request failed
                let err = res['msg']; // Get message from response
                $('.err-msg').show(); // Show err-msg element
                $('.err-msg').html(err); // Change contents of err-msg to message
            }
        }
    });
});