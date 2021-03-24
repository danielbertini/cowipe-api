module.exports = (() => {
  const routes = express.Router();

  const getGifts = require("../services/gifts/getGifts");

  routes.post("/getGifts", cors(corsOptions), getGifts.do);

  return routes;
})();
