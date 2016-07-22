// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

//avoid error that happens when certificate is self signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var api = new ParseServer({
  //verbose: 1,
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  push: {
    android: {
      senderId: process.env.ANDROID_SENDER_ID,
      apiKey:   process.env.ANDROID_API_KEY
    },
    ios: {
      pfx:        process.env.IOS_PFX_PATH,
      //passphrase: '', // optional password to your p12/PFX
      bundleId:   process.env.IOS_BUNDLE_ID,
      production: process.env.IOS_PRODUCTION === "true"
    }
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

connectServer();
function connectServer() {
  //use SSL if keys present and define api port if not present
  var server, useSSL = process.env.SSL_KEY && process.env.SSL_CRT;
  if (useSSL) {
    var fs = require('fs');
    var https = require('https');
    //read the keys
    var privateKey  = fs.readFileSync(process.env.SSL_KEY, 'utf8');
    var certificate = fs.readFileSync(process.env.SSL_CRT, 'utf8');
    var credentials = { key: privateKey, cert: certificate };
    //listen to incoming requests (SSL) - log success or error and exit properly
    server = https.createServer(credentials, app);
  } else {
    server = require('http').createServer(app);
  }
  var port = process.env.PORT || 1337;
  server.listen(port, function(err) { //looks like there is no err here, but an exception - anyways...
    if (err) return console.log('Error when starting server port ' + port + ' (https).', err);
    console.log('Parse Server running on port ' + port + ' (' + (useSSL ? "HTTPS" : "http") + ').');
  });
  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer(server);
}
