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
          persist(request, decode.id)
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

const persist = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        preferences: {
          sound: params.sound,
          visibility: params.visibility,
          reserved: params.reserved,
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
