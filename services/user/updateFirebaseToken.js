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
          let document = {
            firebaseToken: request.body.firebaseToken
          };
          db.collection("users").updateOne(
            { _id: ObjectId(decode.id) },
            { $set: document },
            { upsert: false },
            (error) => {
              if (error) {
                console.error(error);
                response.status(500).send({
                  success: false,
                });
              } else {
                response.status(200).send({
                  success: true,
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
