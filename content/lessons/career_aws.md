---
id: career_aws
title: AWS Bedrock RAG Deployment
tier: bonus
difficulty: advanced
estimated_minutes: 30
module: career
prerequisites: [deploy_rag]
tags: [career, aws, deployment, bedrock]
---

## Concept Introduction

AWS Bedrock is the primary way enterprises deploy RAG in production -- not
because it is the best technology, but because it keeps data inside their VPC,
complies with SOC2/HIPAA, and integrates with their existing IAM infrastructure.
By the end of this lesson you will know how to deploy a RAG system on Bedrock
Knowledge Bases, configure IAM correctly, monitor with CloudWatch, and compare
costs against OpenAI.

## How It Works

Bedrock Knowledge Bases is a managed RAG service that wires together S3 (your
documents), an embedding model (Titan or Cohere), a vector store (OpenSearch
Serverless, Pinecone, or Redis Enterprise Cloud), and a generation model (Claude
on Bedrock). You configure it through the AWS console, the Bedrock API, or
Terraform.

The deployment flow:
1. Upload documents to an S3 bucket with the Bedrock-managed KMS key.
2. Create a Knowledge Base in Bedrock, pointing it at the S3 bucket.
3. Select an embedding model (Titan Text Embeddings v2 for cost, Cohere Embed
   Multilingual for quality across languages).
4. Choose a vector store -- OpenSearch Serverless is the default and keeps
   everything inside AWS.
5. Bedrock automatically chunks, embeds, and indexes the documents.
6. Call `RetrieveAndGenerate` API with a query and a foundation model (Claude 3.5
   Sonnet or Claude 3 Haiku for lower latency) to get grounded responses.

IAM configuration for RAG requires three roles:
- Bedrock execution role (access to S3 bucket, OpenSearch collection, and model
  invocation).
- Application role (permission to call `bedrock:RetrieveAndGenerate`).
- Optional: cross-account role if your app is in a different AWS account from
  the Knowledge Base.

CloudWatch monitoring covers: `RetrieveAndGenerate` call count, latency (p50/p99),
retrieved document count per query, and token usage. Set alarms on latency
breaching 3 seconds or daily token costs exceeding your threshold.

Cost comparison (per 1M queries at 5 retrieved chunks each):
- Bedrock + Titan + Claude Sonnet: approximately $280/month (embeddings + retrieval + generation).
- OpenAI + Pinecone: approximately $340/month (embeddings + vector storage + generation).
- Bedrock wins on data residency and compliance; OpenAI wins on model quality
  per dollar for the generation step. Many enterprises use Bedrock for
  retrieval and compliance, then route to OpenAI for generation through a
  private API gateway.

## Code Examples

Deploy a Bedrock Knowledge Base with the AWS SDK for Python (boto3):

```python
"""Provision a Bedrock Knowledge Base via boto3.
Requires: aws-cli configured, IAM role with bedrock:* and s3:* permissions.
"""
import boto3
import time

bedrock = boto3.client("bedrock-agent", region_name="us-east-1")

# Step 1: Create Knowledge Base linked to an existing S3 bucket
response = bedrock.create_knowledge_base(
    name="my-rag-knowledge-base",
    roleArn="arn:aws:iam::123456789:role/BedrockExecutionRole",
    knowledgeBaseConfiguration={
        "type": "VECTOR",
        "vectorKnowledgeBaseConfiguration": {
            "embeddingModelArn": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
        }
    },
    storageConfiguration={
        "type": "OPENSEARCH_SERVERLESS",
        "opensearchServerlessConfiguration": {
            "collectionArn": "arn:aws:aoss:us-east-1:123456789:collection/my-collection",
            "vectorIndexName": "my-index",
            "fieldMapping": {
                "vectorField": "embedding",
                "textField": "text",
                "metadataField": "metadata"
            }
        }
    }
)
kb_id = response["knowledgeBase"]["knowledgeBaseId"]
print(f"Knowledge Base ID: {kb_id}")

# Step 2: Sync data source (S3 bucket with your documents)
bedrock.start_ingestion_job(
    knowledgeBaseId=kb_id,
    dataSourceId="your-datasource-id"
)
print("Ingestion job started. This takes 2-15 minutes depending on doc count.")
```

Call the RAG endpoint from your application:

```python
"""Query Bedrock Knowledge Base for grounded responses."""
client = boto3.client("bedrock-agent-runtime", region_name="us-east-1")

response = client.retrieve_and_generate(
    input={"text": "What is our refund policy for international orders?"},
    retrieveAndGenerateConfiguration={
        "type": "KNOWLEDGE_BASE",
        "knowledgeBaseConfiguration": {
            "knowledgeBaseId": kb_id,
            "modelArn": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
        }
    }
)
print(response["output"]["text"])
for citation in response["citations"]:
    for ref in citation["retrievedReferences"]:
        print(f"  Source: {ref['location']['s3Location']['uri']}")
```

## Try It Yourself

Create a free-tier AWS account. Upload 5 text documents to an S3 bucket. Use
the AWS console (not code) to create a Knowledge Base, sync the data source, and
run 3 queries through the Bedrock test console. Note the retrieval latency and
retrieved document count for each query.

## Real-World RAG Connection

Fortune 500 companies deploy Bedrock Knowledge Bases for internal HR chatbots,
legal document review, and compliance Q&A because it keeps data off public APIs.
If you can say in an interview "I deployed a Bedrock Knowledge Base inside a
customer's VPC with cross-account IAM and CloudWatch alerting," you have
demonstrated the exact skill enterprise clients pay $200K+ for.

## Common Pitfalls

- **Pitfall:** Forgetting to enable the OpenSearch Serverless collection as a
  Bedrock data source, getting "access denied" errors. **Fix:** In OpenSearch
  Serverless, create a data access policy that grants Bedrock read/write
  permissions on the collection. This is a separate IAM layer from your
  execution role.
- **Pitfall:** Running ingestion without a lifecycle policy on chunked document
  embeddings, causing costs to grow indefinitely. **Fix:** Set a TTL on the
  OpenSearch index or schedule a weekly cleanup of deactivated data sources.
- **Pitfall:** Using the default Titan v1 embeddings when v2 is available. Titan
  v2 reduces embedding dimensions from 1536 to 1024 with better retrieval
  quality, cutting storage costs by 33%. **Fix:** Always select
  `titan-embed-text-v2:0` for new deployments.

## Next Steps

- **Practice:** Deploy a Bedrock Knowledge Base with Terraform using the
  `aws_bedrockagent_knowledge_base` resource. Infrastructure-as-code is how
  enterprises manage RAG deployments, and Terraform experience is listed on
  most senior AI engineer job descriptions.
- **Read:** [AWS Bedrock Knowledge Bases documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- **Related:** [deploy_basics](/lesson/deploy_basics) -- general RAG deployment
  patterns before you go cloud-specific
