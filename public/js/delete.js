let session = document.cookie.split("; ").find((row) => row.startsWith("session=")) ?.split("=")[1]; // Get session ID
if (session) { // If session exists in cookie
    // Send POST request to mainpage
    $.post({
        url: "/mainpage",
        data: {
            session: session
        },
        // When response received
        success: (res) => {
            if (res['success']) { // If request succeeeded
            }
            else {
                // Send POST request to /clearsession
                $.post({
                    url: '/clearsession',
                    data: {
                        session: session
                    },
                    success: (res) => {
                        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Delete cookie by expiring it
                        location.href = "login.html"; // Return to login page
                    }
                }); 
            }
        }
    });
}

else {
    location.href = "login.html";
}

$('form').submit((e) => {
    e.preventDefault() // Disable default behaviour of form submitting; this prevents the page refreshing and code failing to run

    // Send POST request to /delete
    $.post({
        url: "/delete",
        data: {
            // Include session and entered password
            session: session,
            password: $('.password').val()
        },
        success: (res) => {
            if (res['success']) { // If request succeeded
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Delete cookie by expiring it
                location.href = "login.html"; // Return to login page
            }
            else { // If request failed
                let err = res['msg']; // Get message from response
                $('.err-msg').show(); // Show err-msg element
                $('.err-msg').html(err); // Change contents of err-msg to message
            }
        }
    });
});