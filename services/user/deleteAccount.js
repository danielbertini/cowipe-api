const AWS = require("aws-sdk");

var _user = null;

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
          getUser(request, decode.id)
            .then(() => deletePictures(request, decode.id))
            .then(() => deletePicturesCDN(request, decode.id))
            .then(() => deleteMessages(request, decode.id))
            .then(() => deleteConnections(request, decode.id))
            .then(() => deleteActivities(request, decode.id))
            .then(() => deleteBlockeds(request, decode.id))
            .then(() => deleteIntents(request, decode.id))
            .then(() => deleteReports(request, decode.id))
            .then(() => deleteGifts(request, decode.id))
            .then(() => deleteUser(request, decode.id))
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

const getUser = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(userId),
        })
        .then((result) => {
          _user = result;
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteMessages = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("messages")
        .deleteMany({
          $or: [
            {
              _from: ObjectId(userId),
            },
            {
              _to: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteConnections = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("connections")
        .deleteMany({
          $or: [
            {
              _user: ObjectId(userId),
            },
            {
              _targetUser: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deletePictures = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("pictures")
        .deleteMany({
          _user: ObjectId(userId),
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deletePicturesCDN = (request, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const spacesEndpoint = new AWS.Endpoint("fra1.digitaloceanspaces.com");
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: config.spaces.key,
        secretAccessKey: config.spaces.secret,
      });
      await emptyS3Directory(`pictures/${userId}/`);

      let params2 = {
        Bucket: "agarrei",
        Key: `pictures/profiles/${_user.picture}`,
      };
      s3.deleteObject(params2, function (error) {
        if (error) {
          console.error(error);
          return reject([request.__("unavailableService"), null]);
        } else {
          let params3 = {
            Bucket: "agarrei",
            Key: `pictures/profiles/${_user.picture}-small`,
          };
          s3.deleteObject(params3, function (error) {
            if (error) {
              console.error(error);
              return reject([request.__("unavailableService"), null]);
            } else {
              return resolve();
            }
          });
        }
      });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const emptyS3Directory = async (folder) => {
  const spacesEndpoint = new AWS.Endpoint("fra1.digitaloceanspaces.com");
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: config.spaces.key,
    secretAccessKey: config.spaces.secret,
  });
  const listParams = {
    Bucket: "agarrei",
    Prefix: folder,
  };
  const listedObjects = await s3.listObjectsV2(listParams).promise();
  if (listedObjects.Contents.length === 0) return;
  const deleteParams = {
    Bucket: "agarrei",
    Delete: { Objects: [] },
  };
  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });
  await s3.deleteObjects(deleteParams).promise();
  if (listedObjects.IsTruncated) await emptyS3Directory(folder);
};

const deleteActivities = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("activities")
        .deleteMany({
          $or: [
            {
              _userFrom: ObjectId(userId),
            },
            {
              _userTo: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteBlockeds = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("blocked")
        .deleteMany({
          $or: [
            {
              _user: ObjectId(userId),
            },
            {
              _blocked: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteIntents = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("intents")
        .deleteMany({
          _userId: ObjectId(userId),
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteReports = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("reports")
        .deleteMany({
          $or: [
            {
              _user: ObjectId(userId),
            },
            {
              _reportUser: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteGifts = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("userGifts")
        .deleteMany({
          $or: [
            {
              _from: ObjectId(userId),
            },
            {
              _to: ObjectId(userId),
            },
          ],
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};

const deleteUser = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .deleteMany({
          _id: ObjectId(userId),
        })
        .then((result) => {
          return resolve(result);
        });
    } catch (error) {
      console.error(error);
      return reject([request.__("unavailableService"), null]);
    }
  });
};
