var admin = require('firebase-admin');
const serviceAccount = require('./cowipe-e932b-firebase-adminsdk-3ejxn-b9e8d3f7ec.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();