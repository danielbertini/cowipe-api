module.exports = (() => {
  const routes = express.Router();

  const stripe = require("../services/payments/stripe");

  routes.post(
    "/createPaymentIntent",
    cors(corsOptions),
    stripe.createPaymentIntent
  );

  return routes;
})();
