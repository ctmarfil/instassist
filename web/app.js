var express = require('express'),
    fs = require('fs');
    
var app    = express(),
    mytime = new Date(),
    port = process.env.PORT || 5000;
    
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

// Read folder and register each directory
fs.readdir('.', function (err, folders) {
    if (err) throw err;
    folders.forEach(function (folder) {
        app.use('/' + folder, express.static(folder));
    });
});

app.listen(port);
console.log('Welcome to INSTASSIST!!! Node server running on http://localhost:' + port + ', time: '+mytime);
