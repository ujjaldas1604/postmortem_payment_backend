import express from "express";
import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import routes from "./Routes/index"
import connectDB from "./config/connectDB";
import logger from "./config/winston_logger";
import cors from "cors";
import { errorHandler, handle404 } from "./middleware/errorHandler.middleware";
import { config } from "./config/config";
// import { PaymentModel } from "./Models/payments.model";
// import axios from "axios";

const port = config.PORT;

const app = express();

app.use(express.json());

app.use(cors())

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      status: 429,
      error: "Rate limit exceeded",
      retryAfter: "Try again in a few minutes.",
    },
    handler: (_req: Request, res: Response) => {
      console.log("RLE")
      res.status(429).json({
        error:
          "Rate Limit Exceeded from this client. Please try after some time",
      });
    },
    legacyHeaders: false,
  })
);


  //  const statusUpdate = async () => {
  //      const payments = await PaymentModel.find({
  //          $expr: {
  //              $eq: [{ $arrayElemAt: ['$status.status', -1] }, 'Success'],
  //          },
  //      });

  //      logger.warn(`Payments to update: ${payments.length}`)

  //      for (const payment of payments) {

  //       logger.warn(`Processing payment status update for: ${payment.payloadRefId}`)

  //       try{
  //           const formData = new FormData();
  //          formData.append('transactionId', payment.payloadRefId);
  //          formData.append('transactionStatus', 'Success');

  //          formData.append('infoId', payment.informationId);

  //          const limsResponse = await axios.post(
  //              config.PAYMENT_STATUS_LIMS_ENDPOINT,
  //              formData,
  //              {
  //                  headers: {
  //                      Authorization: `Bearer ${config.PAYMENT_STATUS_LIMS_TOKEN}`,
  //                      'Content-Type': 'multipart/form-data',
  //                  },
  //              }
  //          );
  //          logger.info(`LIMS RESPONSE for payment: ${payment.payloadRefId}`,limsResponse.data)

  //       }catch(err: any){
  //         logger.error(`Error in LIMS RESPONSE for payment: ${payment.payloadRefId}`,err.message)
  //       }  
  //      }
  //  };

  // statusUpdate()


// all the routes
app.use('/api', routes);
app.use(errorHandler);
app.use('*', handle404);



app.listen(port, async () => {
  await connectDB();
  logger.info(`[⚡] Server Running at http://127.0.0.1:${port} Running`);
});
