---
id: mm_rag_tables
title: Multi-Modal RAG Tables
tier: expert
difficulty: expert
estimated_minutes: 30
module: multi-modal-rag
prerequisites: [mm_rag_images]
tags: [tables, pdf-extraction, camelot, tabula, chain-of-table, numerical-qa]
---

## Concept Introduction
Tabular data in documents — financial statements, scientific results, specification sheets — resists standard RAG. A naive chunker splits tables across chunks, destroying row-column relationships. Vector similarity over table text loses numerical semantics: "revenue of $2.1B" and "revenue of $2.3B" are embedding-nearby but factually different. Table RAG requires extraction-aware chunking, structure-preserving representations, and reasoning patterns (chain-of-table) that operate over tabular relationships, not just text.

## How It Works
**Table extraction from PDFs** uses specialized tools because PDFs encode tables as positioned characters with no structural markup. Camelot (Python) detects table boundaries using line-detection algorithms; it works well on bordered tables but fails on borderless layouts. Tabula uses a rule-based approach combining whitespace analysis and character clustering; it handles borderless tables better but struggles with merged cells. For scanned PDFs, table detection uses object detection models (Table Transformer, Microsoft's TATR) followed by OCR on detected table regions.

**Table-aware chunking** keeps entire tables together as atomic units. A chunk may contain: (a) the table as Markdown or HTML with explicit row/column structure, (b) a generated text description of what the table contains, (c) metadata about table dimensions, column types, and units. Tables within a document section are chunked alongside their surrounding context paragraph to preserve the narrative connection.

**Chain-of-table reasoning** (Wang et al., 2024) is an LLM reasoning pattern for tabular QA. Instead of a single retrieval-then-read step, the LLM iteratively performs operations on tables: select rows where column X > threshold, sort by column Y, compute aggregates, join with another retrieved table. Each operation transforms the table state, and the chain terminates when the table is reduced to the cells needed for the answer. This is effectively a relational algebra interpreter running inside the LLM's reasoning.

**Numerical QA over tables** requires special handling because the semantic meaning of numbers depends on column context. "Show me companies with revenue over $10B" requires: (a) identifying the revenue column, (b) parsing values with unit awareness ($ vs M vs B), (c) filtering rows, (d) returning the matching company names. A text embedding approach would retrieve paragraphs mentioning "revenue" and "billions" but cannot execute the filtering operation.

## Code Examples

```python
import camelot
import pandas as pd

def extract_tables_from_pdf(pdf_path: str, page_range: str = "1-end") -> list[pd.DataFrame]:
    """Extract tables from a PDF using Camelot's lattice mode."""
    tables = camelot.read_pdf(pdf_path, pages=page_range, flavor="lattice")
    dataframes = []
    for table in tables:
        df = table.df
        # Use first row as header if it looks like one
        if all(not str(c).replace("$", "").replace("%", "").replace(",", "").isdigit()
               for c in df.iloc[0]):
            df.columns = df.iloc[0]
            df = df.iloc[1:]
        dataframes.append(df.reset_index(drop=True))
    return dataframes

def table_to_markdown(df: pd.DataFrame, table_id: str) -> str:
    """Convert a DataFrame to Markdown with metadata for RAG indexing."""
    md = f"## Table: {table_id}\n"
    md += f"Dimensions: {df.shape[0]} rows x {df.shape[1]} columns\n"
    md += f"Columns: {', '.join(str(c) for c in df.columns)}\n\n"
    md += df.to_markdown(index=False)
    return md

def chain_of_table_operation(df: pd.DataFrame, operation: str) -> pd.DataFrame:
    """Execute one chain-of-table operation on a DataFrame."""
    # In production, the LLM generates these operations as structured JSON
    import re
    op_lower = operation.lower()
    if "select rows where" in op_lower:
        condition = operation.split("where", 1)[1].strip()
        # Simple condition parser — production code uses eval-safe expression parser
        col, op, val = re.split(r"\s*(>=|<=|==|!=|>|<)\s*", condition)
        col = col.strip()
        val = float(val.replace(",", "").replace("$", "").replace("B", "e9").replace("M", "e6"))
        if ">=" in condition: return df[df[col].astype(float) >= val]
        elif "<=" in condition: return df[df[col].astype(float) <= val]
        elif ">" in condition: return df[df[col].astype(float) > val]
        elif "<" in condition: return df[df[col].astype(float) < val]
    elif "sort by" in op_lower:
        col = operation.split("sort by", 1)[1].strip()
        ascending = "desc" not in op_lower
        return df.sort_values(by=col, ascending=ascending)
    elif "aggregate" in op_lower or "sum" in op_lower:
        col = re.search(r"(?:sum|avg|count|aggregate)\s+(\w+)", op_lower).group(1)
        return pd.DataFrame({f"total_{col}": [df[col].astype(float).sum()]})
    return df

# Example: chain-of-table for "Which department has the highest average salary?"
def chain_of_table_qa(query: str, df: pd.DataFrame, llm) -> str:
    """Iteratively reduce the table until the answer cell remains."""
    current_df = df.copy()
    for step in range(5):  # max iterations
        prompt = f"""You are reducing a table to answer: {query}
        Current table:
        {current_df.to_markdown(index=False)}
        What single operation should you perform next? Options:
        - SELECT ROWS WHERE [condition]
        - SORT BY [column] [asc/desc]
        - AGGREGATE [function] [column]
        - ANSWER: [final answer]
        Respond with exactly one operation."""
        operation = llm(prompt)
        if operation.startswith("ANSWER:"):
            return operation.replace("ANSWER:", "").strip()
        current_df = chain_of_table_operation(current_df, operation)
    return "Could not reduce table to answer within step limit."
```

## Try It Yourself
Find a 10-K annual report PDF. Extract all tables using both Camelot (lattice mode) and Tabula (stream mode). Compare extraction accuracy on bordered vs borderless tables. Implement table-aware chunking that preserves each table as a Markdown block alongside its section header. Build a chain-of-table agent that can answer: "What was the year-over-year revenue growth rate, and which segment contributed most to that growth?" Compare chain-of-table accuracy against a baseline that sends the full table to the LLM without iterative reduction.

## Real-World RAG Connection
Camelot and Tabula are standard in financial document processing pipelines at Bloomberg and similar firms. Microsoft's Table Transformer (TATR) model pushes detection accuracy on borderless and rotated tables. Google's TAPAS and OmniParser treat table QA as an end-to-end task but are resource-intensive. The latest family of chain-of-table approaches (Wang et al., 2024; DATER, TableGPT) applies reasoning chains instead of single-pass generation for tabular QA, achieving significant gains on TabFact and HiTab benchmarks.

## Common Pitfalls
**Pitfall:** Camelot's lattice detector misses tables without visible grid lines, common in modern PDF design. **Fix:** Run both lattice and stream modes, deduplicate by table location, and use a confidence score based on the percentage of non-empty cells to select the best extraction.

**Pitfall:** The chain-of-table agent generates an invalid operation (e.g., sorting by a non-numeric column) and the table state becomes corrupted for subsequent steps. **Fix:** Execute each operation in a sandbox and validate the result — check that column names exist, operations are mathematically valid, the output DataFrame is non-empty. On failure, feed the error message back to the LLM for a corrected operation.

**Pitfall:** Tables embedded as images (screenshots, scanned documents) are invisible to Camelot/Tabula. **Fix:** Preprocess PDFs with a table detection vision model (Table Transformer) to identify image-based tables, crop the regions, apply OCR, and reconstruct the table structure from OCR bounding boxes.

## Next Steps
Read the Camelot documentation and the chain-of-table paper (Wang et al., 2024). Study Microsoft's Table Transformer on Hugging Face. Take graphrag_concepts to contrast tabular retrieval with graph-based approaches.
