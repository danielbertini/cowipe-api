module.exports = (() => {
  const routes = express.Router();

  const getSent = require("../services/gifts/getSent");
  const getReceived = require("../services/gifts/getReceived");
  const getGifts = require("../services/gifts/getGifts");
  const putGift = require("../services/gifts/putGift");

  routes.post("/getSent", cors(corsOptions), getSent.do);
  routes.post("/getReceived", cors(corsOptions), getReceived.do);
  routes.post("/getGifts", cors(corsOptions), getGifts.do);
  routes.post("/putGift", cors(corsOptions), putGift.do);

  return routes;
})();
