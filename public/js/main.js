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
                // Get data from response
                let firstName = res['firstname'];
                let lastName = res['lastname'];
                let email = res['email'];

                // Set text
                $('.first-name').html(firstName);
                $('.last-name').html(lastName);
                $('.email').html(email);
            }
            else {
                // Send POST request to clearsession
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

// When logout button clicked
$('.logout-button').click(() => {
    // Send POST request to clearsession
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
});