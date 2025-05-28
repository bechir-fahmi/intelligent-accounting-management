# Setting up pgvector with PostgreSQL

This guide will help you set up the pgvector extension for PostgreSQL to enable vector similarity search for your documents.

## Prerequisites

- PostgreSQL 12 or higher
- Admin access to your PostgreSQL database

## Installation Steps

### 1. Install the pgvector Extension

Connect to your PostgreSQL database:

```bash
psql -U postgres -d pfe_accounting
```

Install the pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Database Migration

The application's database schema already includes the necessary column in the `document` table:

- `embedding`: A vector column to store document embeddings
- `textContent`: A text column to store the extracted document text

### 3. Configuration

Make sure you have set your OpenAI API key in the `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Testing Vector Search

You can test vector similarity search with this SQL query:

```sql
SELECT id, original_name, 
       (embedding <-> '[0.1, 0.2, ...]'::vector) as distance
FROM document
ORDER BY distance
LIMIT 5;
```

Replace `[0.1, 0.2, ...]` with an actual vector of the same dimensionality as your embeddings.

## How It Works

1. When a document is uploaded, the system extracts text from the file
2. The text is sent to OpenAI's embedding API to generate a vector representation
3. The vector is stored in the `embedding` column of the document table
4. When searching, the query text is also converted to a vector
5. The database performs similarity search using vector operations

## Troubleshooting

- If embeddings aren't generating, check your OpenAI API key
- Ensure the pgvector extension is properly installed
- Check database logs for any errors related to vector operations 