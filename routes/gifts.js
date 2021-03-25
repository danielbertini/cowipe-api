module.exports = (() => {
  const routes = express.Router();

  const getGifts = require("../services/gifts/getGifts");
  const putGift = require("../services/gifts/putGift");

  routes.post("/getGifts", cors(corsOptions), getGifts.do);
  routes.post("/putGift", cors(corsOptions), putGift.do);

  return routes;
})();
