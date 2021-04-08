module.exports = (() => {
  const routes = express.Router();

  const registrationData = require("../services/user/registrationData");
  const relationship = require("../services/user/relationship");
  const appearance = require("../services/user/appearance");
  const preferences = require("../services/user/preferences");
  const search = require("../services/user/search");
  const pictures = require("../services/user/pictures");
  const restrictedPictures = require("../services/user/restrictedPictures");
  const profile = require("../services/user/profile");
  const activities = require("../services/user/activities");
  const updateStatus = require("../services/user/updateStatus");
  const messages = require("../services/user/messages");
  const getPlan = require("../services/user/getPlan");
  const tuneSearch = require("../services/user/tuneSearch");
  const updateLocation = require("../services/user/updateLocation");
  const deleteAccount = require("../services/user/deleteAccount");
  const tips = require("../services/user/tips");

  routes.get("/registrationData", cors(corsOptions), registrationData.get);
  routes.put(
    "/registrationData/informations",
    cors(corsOptions),
    registrationData.informations
  );
  routes.put(
    "/registrationData/email",
    cors(corsOptions),
    registrationData.email
  );
  routes.get(
    "/registrationData/emailChangeRequestPending",
    cors(corsOptions),
    registrationData.emailChangeRequestPending
  );
  routes.put(
    "/registrationData/cancelEmailChange",
    cors(corsOptions),
    registrationData.cancelEmailChange
  );
  routes.put(
    "/registrationData/checkCodeToChangeEmail",
    cors(corsOptions),
    registrationData.checkCodeToChangeEmail
  );
  routes.put(
    "/registrationData/password",
    cors(corsOptions),
    registrationData.password
  );
  routes.put("/preferences", cors(corsOptions), preferences.put);
  routes.get("/relationship", cors(corsOptions), relationship.get);
  routes.put("/relationship", cors(corsOptions), relationship.put);
  routes.get("/appearance", cors(corsOptions), appearance.get);
  routes.put("/appearance", cors(corsOptions), appearance.put);
  routes.post("/search", cors(corsOptions), search.do);
  routes.get("/profile/:id", cors(corsOptions), profile.do);
  routes.get("/pictures/getTotal", cors(corsOptions), pictures.getTotal);
  routes.get("/pictures/:id/:skip?/:limit?", cors(corsOptions), pictures.do);
  routes.get(
    "/restrictedPictures/:id/:skip?/:limit?",
    cors(corsOptions),
    restrictedPictures.do
  );
  routes.post("/activities", cors(corsOptions), activities.do);
  routes.post("/messages", cors(corsOptions), messages.do);
  routes.put("/updateStatus", cors(corsOptions), updateStatus.do);
  routes.get("/getPlan", cors(corsOptions), getPlan.do);
  routes.put("/tuneSearch", cors(corsOptions), tuneSearch.put);
  routes.put("/updateLocation", cors(corsOptions), updateLocation.put);
  routes.post("/deleteAccount", cors(corsOptions), deleteAccount.do);
  routes.get("/tips", cors(corsOptions), tips.do);

  return routes;
})();
