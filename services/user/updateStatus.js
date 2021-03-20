exports.do = (request, response) => {
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
          let document = {
            online: request.body.status,
          };
          db.collection("users").updateOne(
            { _id: ObjectId(decode.id) },
            { $set: document },
            { upsert: false },
            (error, result) => {
              if (error) {
                logger.fail(error);
                response.status(500).send({
                  success: false,
                  result: request.__("unavailableService"),
                });
              } else {
                response.status(200).send({
                  success: true,
                  result: result,
                });
              }
            }
          );
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
