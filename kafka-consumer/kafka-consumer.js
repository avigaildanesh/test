const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'consumer-app',
  brokers: ['kafka:9092'], // שם השירות מה-docker-compose
});

const consumer = kafka.consumer({ groupId: 'db-change-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'tidb_cdc_topic', fromBeginning: true }); // שימי לב, שם הטופיק חייב להתאים למה ש-TiCDC יוצר

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const log = {
        timestamp: new Date().toISOString(),
        topic,
        partition,
        value: message.value.toString(),
      };
      console.log(JSON.stringify(log));
    },
  });
};

run().catch(console.error);
