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
      if (params.relationShip === "5fa9eb3a201036a4efa3f271") {
        if (validate.isEmpty(params.sugarType)) {
          rejects["sugarType"] = request.__("requiredField");
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

const persist = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        tuneSearch: {
          usersOnline: params.usersOnline,
          usersWithPhoto: params.usersWithPhoto,
          distance: params.distance,
          weight: params.weight,
          height: params.height,
          age: params.age,
          bodyType: params.bodyType ? ObjectId(params.bodyType) : "",
          hairColor: params.hairColor ? ObjectId(params.hairColor) : "",
          eyeColor: params.eyeColor ? ObjectId(params.eyeColor) : "",
          maritalStatus: params.maritalStatus
            ? ObjectId(params.maritalStatus)
            : "",
          relationShip: params.relationShip
            ? ObjectId(params.relationShip)
            : "",
          sugarType: params.sugarType ? ObjectId(params.sugarType) : "",
        },
      };
      db.collection("users").updateOne(
        { _id: ObjectId(userId) },
        { $set: document },
        { upsert: false },
        (error, result) => {
          if (error) {
            console.error(error);
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
