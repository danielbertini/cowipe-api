module.exports = (() => {

  const routes = express.Router();

  const signin = require('../services/auth/signin');
  const signup1 = require('../services/auth/signup1');
  const signup2 = require('../services/auth/signup2');
  const signup3 = require('../services/auth/signup3');
  const signup4 = require('../services/auth/signup4');
  const passwordRecovery1 = require('../services/auth/passwordRecovery1');
  const passwordRecovery2 = require('../services/auth/passwordRecovery2');

  routes.post('/signin', cors(corsOptions), signin.do);
  routes.post('/signup1', cors(corsOptions), signup1.do);
  routes.post('/signup2', cors(corsOptions), signup2.do);
  routes.post('/signup3', cors(corsOptions), signup3.do);
  routes.post('/signup4', cors(corsOptions), signup4.do);
  routes.post('/passwordRecovery1', cors(corsOptions), passwordRecovery1.do);
  routes.post('/passwordRecovery2', cors(corsOptions), passwordRecovery2.do);

  return routes;

})();