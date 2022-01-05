#!/usr/bin/env node
const app = require('./app');
'use strict';

// get environment variable
var port = 4040;
if(process.env.EXPRESS_SERVER_PORT) {
	port = process.env.EXPRESS_SERVER_PORT;
}

// start server
app.api.listen(port, () => {
	console.log('Express server listening on port ' + port);
	//mainLoop();
});
