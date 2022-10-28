require('dotenv').config();
const { Client, Connection } = require('@opensearch-project/opensearch');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const aws4 = require('aws4');

const host = process.env.CLOUD_DB_HOST;

const createAwsConnector = (credentials, region) => {
  class AmazonConnection extends Connection {
    buildRequestObject(params) {
      const request = super.buildRequestObject(params);
      request.service = 'es';
      request.region = region;
      request.headers = request.headers || {};
      request.headers['host'] = request.hostname;

      return aws4.sign(request, credentials);
    }
  }
  return {
    Connection: AmazonConnection,
  };
};

const getClient = async () => {
  const credentials = await defaultProvider()();
  return new Client({
    ...createAwsConnector(credentials, 'ap-northeast-1'),
    node: host,
  });
};

async function creatMapping() {
  // get db connection
  const client = await getClient();

  let result = await client.search({
    index: 'movies',
    body: {
      query: {
        match_all: {},
      },
    },
  });

  console.log(result.body.hits.hits[0]._source);
}

creatMapping().catch(console.log);
