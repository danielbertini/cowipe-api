exports.restricted = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          checkParams(request)
            .then((result) => persistRestricted(request, decode.id))
            .then(() => {
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

const persistRestricted = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        restricted: params.restricted,
      };
      db.collection("pictures").updateOne(
        { _id: ObjectId(params.pictureId), _user: ObjectId(id) },
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

exports.selected = (request, response) => {
  try {
    jwt.verify(
      request.headers.authorization,
      config.jwt.secret,
      (error, decode) => {
        if (error) {
          console.error(error);
          response.status(401).send({
            success: false,
            message: request.__("invalidToken"),
          });
        } else {
          checkParams(request)
            .then((result) => persistSelected(request, decode.id))
            .then(() => {
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

const persistSelected = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let document = {
        selected: params.selected,
      };
      db.collection("pictures").updateOne(
        { _id: ObjectId(params.pictureId), _user: ObjectId(id) },
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

const checkParams = (request) => {
  return new Promise((resolve, reject) => {
    try {
      let params = request.body;
      let rejects = {};
      if (validate.isEmpty(params.pictureId)) {
        rejects["pictureId"] = request.__("requiredField");
      }
      if (Object.entries(rejects).length === 0) {
        resolve();
      } else {
        reject([request.__("checkTheForm"), rejects]);
      }
    } catch (error) {
      console.error(error);
      reject([request.__("unavailableService"), null]);
    }
  });
};
