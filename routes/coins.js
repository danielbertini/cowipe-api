module.exports = (() => {
  const routes = express.Router();

  const getCoins = require("../services/coins/getCoins");
  const putCoins = require("../services/coins/putCoins");

  routes.get("/getCoins", cors(corsOptions), getCoins.do);
  routes.put("/putCoins", cors(corsOptions), putCoins.do);

  return routes;
})();
