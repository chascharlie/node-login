// Import required modules
const http = require('http');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Open/create SQLite database and create tables if they don't already exist
var db = new sqlite3.Database('./db/users.db');
db.run(`CREATE TABLE IF NOT EXISTS users (
	userid INTEGER NOT NULL,
	firstname TEXT NOT NULL,
	lastname TEXT NOT NULL,
	email TEXT NOT NULL,
	password TEXT NOT NULL,
	PRIMARY KEY(userid AUTOINCREMENT)
);`);

db.run(`CREATE TABLE IF NOT EXISTS sessions (
	userid INTEGER NOT NULL,
	sessionid TEXT NOT NULL
);`);

var app = express(); // Create Express application
app.use(express.static(__dirname+"/public", {index: 'main.html'})); // Serve static HTML, CSS, and JS files from public directory

// POST request register
// This will get information submitted from registration form and put it into database
app.post('/register',express.urlencoded({extended: true}), (req,res) => {
    // Get data submitted in form
    let firstName = req.body.firstname;
    let lastName = req.body.lastname;
    let email = req.body.email;
    let password = crypto.createHmac('sha256',req.body.password).digest('hex'); // Hash password as SHA256
    
    // Check if email is already registered
    db.get(`SELECT email FROM users WHERE email='${email}';`, (err,row) => {
        if (row) { // If entry was found, meaning email already in use
            res.jsonp({
                success: false,
                msg: "Email address already in use"
            });
        }
        else if (err) { // If SQL error occured
            res.jsonp({
                success: false,
                msg: "SQL-related error, please contact administrators"
            });
        }
        else { // Entry not found and no error occured, meaning email is free
            // Insert new entry into database
            db.run(`INSERT INTO users (firstname,lastname,email,password)
            VALUES ('${firstName}','${lastName}','${email}','${password}');`, (err) => {
                if (err) {
                    res.jsonp({
                        success: false,
                        msg: "SQL-related error, please contact administrators"
                    });
                }
                else {
                    res.jsonp({
                        success: true
                    });
                }
            });
        }
    });
});

// POST request login
// This will verify user details before generating and sending a session ID to client
app.post('/login',express.urlencoded({extended: true}), (req,res) => {
    // Get data submitted in form
    let email = req.body.email;
    let password = crypto.createHmac('sha256',req.body.password).digest('hex'); // Hash password as SHA256

    // Check if details are correct
    db.get(`SELECT userid FROM users WHERE email='${email}' AND password='${password}';`, (err,row) => {
        if (row) { // If entry found, meaning credentials are valid
            let userId = row.userid; // Get user ID from entry
            let sessionId;
            
            // Generate a session ID, looping until it is unique to all others
            while (true) {
                const chars = ["abcdefghijklmnopqrstuvwxyz".split(""),"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),"1234567890".split("")];
                sessionId = "" // Define session ID as empty string

                // Loop i from 0 to 10
                for (let i = 0; i < 10; i++) {
                    let type = Math.floor(Math.random() * 3); // Randomly pick a number between 0 and 2, this will determine what type of character is selected
                    let char = Math.floor(Math.random() * chars[type].length); // Randomly pick a number between 0 and the length of the nested array

                    sessionId += chars[type][char]; // Add the corresponding character to session ID
                }

                // Determine if ID is already in use
                let idExists = false;
                db.get(`SELECT sessionid FROM sessions WHERE sessionid='${sessionId}';`, (err,row) => {
                    if (row) {
                        idExists = true;
                    }
                });

                if (idExists) { continue; } // If ID is in use, restart loop
                break; // Otherwise, break out of it
            }

            // Insert new entry into sessions table
            db.run(`INSERT INTO sessions (userid,sessionid)
            VALUES ('${userId}','${sessionId}');`, (err) => {
                if (err) {
                    res.jsonp({
                        success: false,
                        msg: "SQL-related error, please contact administrators"
                    });                    
                }
                else {
                    res.jsonp({
                        success: true,
                        session: sessionId // Include session ID in response
                    });
                }
            });
        }
        else if (err) { // If SQL error occured
            res.jsonp({
                success: false,
                msg: "SQL-related error, please contact administrators"
            });
        }
        else { // Entry not found and no error occured, meaning credentials are invalid
            res.jsonp({
                success: false,
                msg: "Incorrect username or password"
            });
        }
    });
});

// POST request mainpage
// This will get the ID corresponding to a session and the first and last name and email of that ID
app.post('/mainpage',express.urlencoded({extended: true}), (req,res) => {
    let sessionId = req.body.session; // Get session sent by client
    
    // Get user ID corresponding to session
    db.get(`SELECT userid FROM sessions WHERE sessionid='${sessionId}';`, (err,row) => {
        if (row) { // If entry found
            let userId = row.userid; // Get correspondent user ID

            // Get details corresponding to user ID
            db.get(`SELECT firstname, lastname, email FROM users WHERE userid='${userId}';`, (err,row) => {
                if (row) {
                    // Put results into variables
                    let firstName = row.firstname;
                    let lastName = row.lastname;
                    let email = row.email;

                    // Include details in response
                    res.jsonp({
                        success: true,
                        firstname: firstName,
                        lastname: lastName,
                        email: email
                    });
                }
                else {
                    res.jsonp({
                        success: false,
                    });                   
                }
            });
        }
    });
});

// POST request clearsession
// This will remove an entry from the sessions database
app.post('/clearsession',express.urlencoded({extended: true}), (req,res) => {
    let sessionId = req.body.session; // Get session sent by client
    db.run(`DELETE FROM sessions WHERE sessionid='${sessionId}';`); // Delete row with session
    res.jsonp({success:true});
});

// POST request delete
// This will delete a user from the database
app.post('/delete',express.urlencoded({extended: true}), (req,res) => {
    // Get session ID and hash entered password
    let password = crypto.createHmac('sha256',req.body.password).digest('hex');
    let sessionId = req.body.session;

    // Find user ID corresponding to session
    db.get(`SELECT userid FROM sessions WHERE sessionid='${sessionId}'`, (err,row) => {
        if (row) { // If user ID was found
            let userId = row.userid; // Get user ID from entry
            
            // Check if password entered is correct
            db.get(`SELECT userid FROM users WHERE password='${password}' AND userid='${userId}'`, (err,row) => {
                if (row) {
                    // Delete row corresponding to user ID
                    db.run(`DELETE FROM users WHERE userid='${userId}'`, (err) => {
                        if (err) { // If a SQL error occured
                            res.jsonp({
                                success: false,
                                msg: "SQL-related error, please contact administrators"
                            });
                        }
                        else {
                            // Delete all sessions corresponding to user ID
                            db.run(`DELETE FROM sessions WHERE userid='${userId}'`, (err) => {
                                if (err) { // If a SQL error occured
                                    res.jsonp({
                                        success: false,
                                        msg: "SQL-related error, please contact administrators"
                                    });
                                }
                                else { // No error
                                    res.jsonp({
                                        success: true
                                    });
                                }
                            });
                        }
                    });
                }
                else if (err) { // If a SQL error occured
                    res.jsonp({
                        success: false,
                        msg: "SQL-related error, please contact administrators"
                    });
                }
                else { // No SQL error or matching entry, meaning password is incorrect
                    res.jsonp({
                        success: false,
                        msg: "Incorrect password"
                    });  
                }
            });

        }
        else if (err) { // If a SQL error occured
            res.jsonp({
                success: false,
                msg: "SQL-related error, please contact administrators"
            });
        }
        else { // No matching entry for user ID on users table
            res.jsonp({
                success: false,
                msg: "User not found on database"
            });  
        }
    });
});

const server = http.createServer(app); // Create server running express app
server.listen(8080); // Run on port 8080