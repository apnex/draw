const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// initialise app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const cors = require('cors');
app.use(cors());

// save
app.get('/', (req, res) => {
	console.log('[ GET ] /');

	// save to disk
	fs.writeFileSync('test.txt', 'mooooo');

	res.status(200).send({});
});

// save
app.post('/save/:fileId', (req, res) => {
	let fileId = req.params.fileId;
	console.log('[ POST ] /save/' + fileId);

	let body = req.body;
	fs.writeFileSync(fileId, JSON.stringify(body, null, "\t"));
	console.log('File [ ' + fileId + ' ] saved');

	res.status(200).send(body);
});

// save
app.get('/load/:fileId', (req, res) => {
	let fileId = req.params.fileId;
	console.log('[ GET ] /load/' + fileId);

	let body = fs.readFileSync(fileId);
	console.log('File [ ' + fileId + ' ] loaded');

	res.status(200).send(body);
});

// Serve static html files
//app.use('/', express.static(path.join(__dirname, 'html')))
module.exports = {
	api: app
};
