import amqp from "amqplib";

let connection = null;
let channel = null;

export const getChannel = async () => {
  if (channel) return channel;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      channel = null;
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed");
      channel = null;
    });

    console.log("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error.message);
    channel = null;
    return null;
  }
};
