var express = require('express'),
    fs = require('fs');
    
var app    = express(),
    mytime = new Date(),
    port = process.env.PORT || 5000,
    awsAccessKey = process.env.awsAccessKey || '',
    awsSecretKey = process.env.awsSecretKey || '';

var aws = require("aws-sdk");
    aws.config.update({
        region: "ap-southeast-1",
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey
    });
var db = new aws.DynamoDB.DocumentClient(),
    table = "instassist-entities";

var getQuery = function(req, key) {
    return (req && req.query && req.query[key]) ? req.query[key] : null;
}

/**
 * sends JSON response
 */
var sendErrorResponse = function(res, err, code) {
    console.log("Sending Error Response - ", err);
    res.writeHead(code, {"Content-Type": "application/json"});
    res.end();
}

/** 
 * send Ok or Success response
 */
var sendSuccessResponse = function(res, data) {
    console.log("Sending Success Response");
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(data));
    res.end();
}
    
app.use(function(req, res, next) {
    res.header('X-Frame-Options', 'DENY');
    res.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    return next();
});

app.get('/', function(req, res){
    fs.readFile("index.html", "binary", function(err, file) {
        if(err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(file, "binary");
        res.end();
        
    });
});

app.get('/settings', function(req, res) {
    var email = getQuery(req, 'email');

    if (email) {
        var params = {
            TableName: table,
            Key: {
                entityid: email,
            }
        }

        db.get(params, function(err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                sendErrorResponse(res, error, 500);
            } else {
                sendSuccessResponse(res, data);
            }
        });
    } else {
        sendErrorResponse(res, 'Bad Request', 400);
    }
});

// Read folder and register each directory
fs.readdir('.', function (err, folders) {
    if (err) throw err;
    folders.forEach(function (folder) {
        app.use('/' + folder, express.static(folder));
    });
});











// var params = {
//    TableName: "instassist-entities"
// };

// db.scan(params, function(err, data) {
//     console.log("data", data);
//    if (err)
//        console.log(JSON.stringify(err, null, 2));
//    else
//        console.log(JSON.stringify(data, null, 2));
// });

app.listen(port);
console.log('Welcome to INSTASSIST!!! Node server running on http://localhost:' + port + ', time: '+mytime);
