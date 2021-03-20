exports.do = (request, response) => {
  try {
    db.collection("complaintTypes")
      .find({})
      .sort({ name: 1 })
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
