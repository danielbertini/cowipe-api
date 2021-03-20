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
          const bodyTypes = await db
            .collection("bodyTypes")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const eyeColors = await db
            .collection("eyeColors")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const hairColors = await db
            .collection("hairColors")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const user = await db
            .collection("users")
            .find(
              { _id: ObjectId(decode.id) },
              {
                projection: {
                  appearance: 1,
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
              bodyTypes: bodyTypes,
              eyeColors: eyeColors,
              hairColors: hairColors,
              user: user,
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
      if (!parseInt(params.height)) {
        rejects["height"] = request.__("requiredField");
      }
      if (!parseInt(params.weight)) {
        rejects["weight"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.bodyType)) {
        rejects["bodyType"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.hairColor)) {
        rejects["hairColor"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.eyeColor)) {
        rejects["eyeColor"] = request.__("requiredField");
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
        appearance: {
          height: parseInt(params.height),
          weight: parseInt(params.weight),
          _bodyType: ObjectId(params.bodyType),
          _hairColor: ObjectId(params.hairColor),
          _eyeColor: ObjectId(params.eyeColor),
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
