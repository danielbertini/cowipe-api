const stripe = require("stripe")(config.stripe.key);

exports.createPaymentIntent = async (request, response) => {
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
          getStripeCustomerId(request, decode.id)
            .then((stripeCustomerId) =>
              requestPaymentIntent(request, stripeCustomerId)
            )
            .then((clientSecret) => {
              response.status(200).send({
                success: true,
                clientSecret: clientSecret,
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

const getStripeCustomerId = (request, userId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("users")
        .findOne({
          _id: ObjectId(userId),
        })
        .then(async (result) => {
          if (result) {
            if (result.stripeCustomerId) {
              return resolve(result.stripeCustomerId);
            } else {
              const customer = await stripe.customers.create({
                email: result.email,
                metadata: {
                  id: result._id.toString(),
                  username: result.username,
                },
              });
              let document = {
                stripeCustomerId: customer.id,
              };
              db.collection("users").updateOne(
                { _id: ObjectId(userId) },
                { $set: document },
                { upsert: false },
                (error, result) => {
                  if (error) {
                    console.error(error);
                    return reject([request.__("unavailableService"), null]);
                  } else {
                    return resolve(customer.id);
                  }
                }
              );
            }
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

const requestPaymentIntent = (request, stripeCustomerId) => {
  return new Promise((resolve, reject) => {
    try {
      db.collection("coins")
        .findOne({
          _id: ObjectId(request.body.coinId),
        })
        .then(async (result) => {
          if (result) {
            const paymentIntent = await stripe.paymentIntents.create({
              customer: stripeCustomerId,
              setup_future_usage: "off_session",
              amount: result.price,
              currency: "usd",
              metadata: {
                userId: "xxx",
                coinId: "xxx",
              },
            });
            return resolve(paymentIntent.client_secret);
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
