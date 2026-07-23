import { getChannel } from "./rabbitmq.config.js";
import { EMAIL_DLQ_NAME, EMAIL_QUEUE_PRIORITY, generateMessageId } from "./constants.js";

export const produceToQueue = async (queueName, payload, dlqQueueName = "") => {
  try {
    const channel = await getChannel();
    if (!channel) throw new Error("RabbitMQ is unavailable");

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

/**
 * Publishes an email job to the email queue, filling in the boilerplate
 * (messageId, source, sender, DLQ name, routing key/priority) shared by
 * every email producer. Anything caller-specific (recipient, content,
 * attachments) is passed in; anything queue-specific (priority level,
 * sender, dlqName) can be overridden.
 */
export const publishEmailToQueue = async ({
  rawHtml,
  subject,
  emailType,
  to,
  cc,
  attachments,
  priorityLevel = "NORMAL",
  sender = {
    name: "Techjockey",
    email: process.env.NOREPLY_EMAIL,
    replyTo: process.env.NOREPLY_EMAIL,
  },
  dlqName = EMAIL_DLQ_NAME,
  ...rest
}) => {
  const { routingKey, priority } = EMAIL_QUEUE_PRIORITY[priorityLevel];

  return produceToQueue(
    routingKey,
    {
      messageId: generateMessageId(),
      source: "techjockey",
      priority,
      rawHtml,
      subject,
      email_type: emailType,
      ...(attachments ? { attachments } : {}),
      recipient: { to, ...(cc ? { cc } : {}) },
      sender,
      ...rest,
    },
    dlqName,
  );
};
