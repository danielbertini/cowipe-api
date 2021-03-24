var _profile = null;
var _gifts = null;
var _balance = null;

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
          getProfile(request, request.body.id)
            .then(() => getGifts(request))
            .then(() => getBalance(request, decode.id))
            .then(() => {
              response.status(200).send({
                success: true,
                profile: _profile,
                gifts: _gifts,
                balance: _balance ? _balance : 0,
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

const getProfile = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne(
          {
            _id: ObjectId(id),
          },
          {
            projection: {
              _id: 1,
              username: 1,
            },
          }
        )
        .then((result) => {
          if (result) {
            _profile = result;
            return resolve();
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getGifts = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("gifts")
        .find({})
        .sort({
          amount: 1,
        })
        .toArray()
        .then((result) => {
          if (result) {
            _gifts = result;
            return resolve();
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const getBalance = (request, id) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne(
          {
            _id: ObjectId(id),
          },
          {
            projection: {
              balance: 1,
            },
          }
        )
        .then((result) => {
          if (result) {
            _balance = result.balance;
            return resolve();
          } else {
            return reject([request.__("unavailableService"), null]);
          }
        });
    } catch (error) {
      console.log(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
