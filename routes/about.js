module.exports = (() => {
  const routes = express.Router();

  const talkWithUs = require("../services/about/talkWithUs");

  routes.post("/talkWithUs", cors(corsOptions), talkWithUs.do);

  return routes;
})();
