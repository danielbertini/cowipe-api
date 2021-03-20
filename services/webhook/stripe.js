exports.do = (request, response) => {
  try {
    var event = request.body;
    var data;
    switch (event.type) {
      case "payment_intent.succeeded":
        data = event.data.object;
        console.log("payment_intent.succeeded: ", data);
        break;
      case "payment_intent.created":
        data = event.data.object;
        console.log("payment_intent.created: ", data);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
  } catch (error) {
    console.error(error);
    response.json({ received: false });
  }
};
