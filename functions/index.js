const functions = require('firebase-functions');

exports.nextServer = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 120,
  })
  .https.onRequest((req, res) => {
    res.redirect('https://biblepediaio.web.app');
  }); 