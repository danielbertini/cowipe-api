module.exports = (() => {
  const routes = express.Router();

  const getBalance = require("../services/coins/getBalance");
  const getCoins = require("../services/coins/getCoins");
  const putCoins = require("../services/coins/putCoins");

  routes.get("/getBalance", cors(corsOptions), getBalance.do);
  routes.get("/getCoins", cors(corsOptions), getCoins.do);
  routes.put("/putCoins", cors(corsOptions), putCoins.do);

  return routes;
})();
