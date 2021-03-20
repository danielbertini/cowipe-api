module.exports = (() => {
  const routes = express.Router();

  routes.get("/", cors(corsOptions), (request, response) => {
    response.send({ response: "Hi!" }).status(200);
  });

  return routes;
})();
