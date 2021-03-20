module.exports = (() => {
  const routes = express.Router();

  const get = require("../services/pictures/get");
  const profile = require("../services/pictures/profile");
  const put = require("../services/pictures/put");
  const remove = require("../services/pictures/remove");
  const upload = require("../services/pictures/upload");

  routes.get("/get/:skip?/:limit?", cors(corsOptions), get.do);
  routes.post("/restrictedsCount", cors(corsOptions), get.restrictedsCount);
  routes.post("/profile", cors(corsOptions), profile.do);
  routes.put("/restricted", cors(corsOptions), put.restricted);
  routes.put("/selected", cors(corsOptions), put.selected);
  routes.delete("/delete", cors(corsOptions), remove.do);
  routes.post("/upload", cors(corsOptions), upload.do);

  return routes;
})();
