exports.do = (request, response) => {
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
          const eyeColors = await db
            .collection("eyeColors")
            .find({})
            .sort({ name: 1 })
            .toArray()
            .then((result) => {
              return result;
            });
          const bodyTypes = await db
            .collection("bodyTypes")
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
            .findOne({
              _id: ObjectId(decode.id),
            })
            .then((result) => {
              return result;
            });
          response.status(200).send({
            success: true,
            data: {
              maritalStatus: maritalStatus,
              relationshipTypes: relationshipTypes,
              sugarTypes: sugarTypes,
              eyeColors: eyeColors,
              bodyTypes: bodyTypes,
              hairColors: hairColors,
              userTuneSearch: user.tuneSearch,
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
