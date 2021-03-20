module.exports = (() => {
  const routes = express.Router();

  const getActivityTypes = require("../services/commons/getActivityTypes.js");
  const getGenders = require("../services/commons/getGenders");
  const getOrientations = require("../services/commons/getOrientations");
  const getMaritalStatus = require("../services/commons/getMaritalStatus");
  const getRelationshipTypes = require("../services/commons/getRelationshipTypes");
  const getSugarTypes = require("../services/commons/getSugarTypes");
  const getBodyTypes = require("../services/commons/getBodyTypes");
  const getHairColors = require("../services/commons/getHairColors");
  const getEyeColors = require("../services/commons/getEyeColors");
  const getComplaintTypes = require("../services/commons/getComplaintTypes");
  const getTunningSearchOptions = require("../services/commons/getTunningSearchOptions");

  routes.get("/getActivityTypes", cors(corsOptions), getActivityTypes.do);
  routes.get("/getGenders", cors(corsOptions), getGenders.do);
  routes.get("/getOrientations", cors(corsOptions), getOrientations.do);
  routes.get("/getMaritalStatus", cors(corsOptions), getMaritalStatus.do);
  routes.get(
    "/getRelationshipTypes",
    cors(corsOptions),
    getRelationshipTypes.do
  );
  routes.get("/getSugarTypes", cors(corsOptions), getSugarTypes.do);
  routes.get("/getBodyTypes", cors(corsOptions), getBodyTypes.do);
  routes.get("/getHairColors", cors(corsOptions), getHairColors.do);
  routes.get("/getEyeColors", cors(corsOptions), getEyeColors.do);
  routes.get("/getComplaintTypes", cors(corsOptions), getComplaintTypes.do);
  routes.get(
    "/getTunningSearchOptions",
    cors(corsOptions),
    getTunningSearchOptions.do
  );

  return routes;
})();
