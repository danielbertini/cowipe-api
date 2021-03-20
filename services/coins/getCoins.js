exports.do = (request, response) => {
  try {
    db.collection("coins")
      .find({})
      .sort({ quantity: 1 })
      .toArray()
      .then((result) => {
        response.status(200).send({
          success: true,
          result: result,
        });
      });
  } catch (error) {
    console.error(error);
    response.status(500).send({
      success: false,
      message: request.__("unavailableService"),
    });
  }
};
