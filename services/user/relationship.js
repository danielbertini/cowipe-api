exports.get = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      async (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          const genders = await db
            .collection("genders")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const orientationTypes = await db
            .collection("orientationTypes")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const maritalStatus = await db
            .collection("maritalStatus")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const relationshipTypes = await db
            .collection("relationshipTypes")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const sugarTypes = await db
            .collection("sugarTypes")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const userRelationship = await db
            .collection("users")
            .find(
              { _id: ObjectId(decode.id) },
              {
                projection: {
                  relationship: 1,
                },
              }
            )
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          response.status(200).send({
            success: true,
            data: {
              genders: genders,
              orientationTypes: orientationTypes,
              maritalStatus: maritalStatus,
              relationshipTypes: relationshipTypes,
              sugarTypes: sugarTypes,
              userRelationship: userRelationship,
            },
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

exports.put = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(403).send({
            success: false,
            message: request.__("invalidAccess"),
          });
        } else {
          checkParams(request)
            .then(() => persist(request, decode.id))
            .then((result) => {
              response.status(200).send({
                success: true,
              });
            })
            .catch((result) => {
              response.status(200).send({
                success: false,
                message: result[0],
                errors: result[1],
              });
            });
        }
      }
    );
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};

const checkParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.gender)) {
        rejects["gender"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.orientation)) {
        rejects["orientation"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.maritalStatus)) {
        rejects["maritalStatus"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.relationship)) {
        rejects["relationship"] = request.__("requiredField");
      } else {
        if (params.relationship === "5fa9eb3a201036a4efa3f271") {
          if (validate.isEmpty(params.sugar)) {
            rejects["sugar"] = request.__("requiredField");
          }
        }
      }
      if (Object.entries(rejects).length === 0) {
        return resolve();
      } else {
        return reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persist = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        relationship: {
          _gender: ObjectId(params.gender),
          _orientation: ObjectId(params.orientation),
          _maritalStatus: ObjectId(params.maritalStatus),
          _relationship: ObjectId(params.relationship),
          _sugar: ObjectId(params.sugar),
        },
      };
      db.collection("users").updateOne(
        { _id: ObjectId(id) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            logger.fail(error);
            return reject([request.__("unavailableService"), null]);
          } else {
            return resolve();
          }
        }
      );
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};
