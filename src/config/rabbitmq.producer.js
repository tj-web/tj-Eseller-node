import { getChannel } from "./rabbitmq.config.js";

export const produceToQueue = async (queueName, payload, dlqQueueName = "") => {
  try {
    const channel = await getChannel();
    let queueOptions = { durable: true };
    
    if (dlqQueueName)
      queueOptions = { ...queueOptions, arguments: { "x-dead-letter-exchange": dlqQueueName } };

    await channel.assertQueue(queueName, queueOptions);

    return channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  } catch (error) {
    console.error(`Failed to publish message to queue "${queueName}":`, error);
    throw error;
  }
};
