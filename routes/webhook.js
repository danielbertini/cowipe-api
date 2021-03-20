module.exports = (() => {
  const routes = express.Router();

  const stripe = require("../services/webhook/stripe");

  routes.post("/stripe", cors(corsOptions), stripe.do);

  return routes;
})();
