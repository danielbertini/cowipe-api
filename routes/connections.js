module.exports = (() => {
  const routes = express.Router();

  const put = require("../services/connections/put");
  const accept = require("../services/connections/accept");
  const block = require("../services/connections/block");
  const unblock = require("../services/connections/unblock");
  const cancel = require("../services/connections/cancel");
  const refuse = require("../services/connections/refuse");
  const report = require("../services/connections/report");
  const remove = require("../services/connections/remove");
  const get = require("../services/connections/get");

  routes.put("/request", cors(corsOptions), put.do);
  routes.put("/accept", cors(corsOptions), accept.do);
  routes.put("/block", cors(corsOptions), block.do);
  routes.put("/refuse", cors(corsOptions), refuse.do);
  routes.put("/report", cors(corsOptions), report.do);
  routes.delete("/delete", cors(corsOptions), remove.do);
  routes.delete("/cancel", cors(corsOptions), cancel.do);
  routes.delete("/unblock", cors(corsOptions), unblock.do);
  routes.get("/byUser", cors(corsOptions), get.do);
  routes.get("/unreadsByUser", cors(corsOptions), get.unreads);

  return routes;
})();
