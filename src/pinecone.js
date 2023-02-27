import { PineconeClient } from "@pinecone-database/pinecone";
import * as dotenv from "dotenv";
dotenv.config();

const indexName = process.env.INDEX_NAME;
const pineconeClient = new PineconeClient();

await pineconeClient.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

const saveEmbedding = async ({ id, values, metadata, namespace }) => {
  const index = pineconeClient.Index(indexName);
  const upsertRequest = {
    vectors: [
      {
        id,
        values,
        metadata,
      },
    ],
    namespace,
  };
  try {
    const response = await index.upsert(upsertRequest);
    return response?.upsertedCount > 0
      ? {
          message: "training",
        }
      : {
          message: "failed training",
        };
  } catch (e) {
    console.log("failed", e.response);
  }
};

const queryEmbedding = async ({ values, namespace }) => {
  const index = pineconeClient.Index(indexName);
  const queryRequest = {
    topK: 1,
    vector: values,
    includeMetadata: true,
    namespace,
  };
  try {
    const response = await index.query(queryRequest);
    const match = response.matches[0];
    const metadata = match?.metadata;
    const score = match?.score;
    return {
      label: metadata?.label || "Unknown",
      confidence: score,
    };
  } catch (e) {
    console.log("failed", e.response);
  }
};

const deleteNamespace = async ({ namespace }) => {
  const index = pineconeClient.Index(indexName);
  try {
    await index.delete1([], true, namespace);
  } catch (e) {
    console.log("failed", e.response);
  }
};

export { saveEmbedding, queryEmbedding, deleteNamespace };
