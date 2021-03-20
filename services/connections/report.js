var _connection = null;

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
          checkParams(request, decode.id)
            .then(() => verifyReport(request, decode.id))
            .then(() => persistReport(request, decode.id))
            .then(() => {
              response.status(200).send({
                success: true,
                connection: _connection,
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
      if (validate.isEmpty(params.complaintType)) {
        rejects["complaintType"] = request.__("requiredField");
      }
      if (validate.isEmpty(params.comments)) {
        rejects["comments"] = request.__("requiredField");
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

const verifyReport = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("reports")
        .findOne({
          _user: ObjectId(userId),
          _reportUser: ObjectId(request.body.id),
        })
        .then((result) => {
          if (result && result._id) {
            return reject([request.__("connection.alreadyReported"), null]);
          } else {
            return resolve();
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const persistReport = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      let document = {
        _user: ObjectId(userId),
        _reportUser: ObjectId(request.body.id),
        _complaintType: ObjectId(request.body.complaintType),
        comments: request.body.comments,
        created: new Date(),
      };
      db.collection("reports").insertOne(document, (error) => {
        if (error) {
          console.log(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          return resolve();
        }
      });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
