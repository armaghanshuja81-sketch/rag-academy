"""
RAG Engine — Professional RAG implementation with ChromaDB support.
"""
import re
import json
import numpy as np

class SimpleRAGEngine:
    """Keyword-based RAG engine (works without any API keys)."""

    SAMPLE_DOCUMENTS = [
        {
            'title': 'What is Flask?',
            'topic': 'Python Web Development',
            'content': "Flask is a lightweight WSGI web application framework in Python. It was created by Armin Ronacher in 2010. Flask is called a microframework because it does not require particular tools or libraries. Key features include a built-in development server, integrated support for unit testing, RESTful request dispatching, Jinja2 templating, and support for secure cookies. Flask runs on port 5000 by default."
        },
        {
            'title': 'Understanding HTML',
            'topic': 'Web Fundamentals',
            'content': "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. HTML uses tags like h1, p, div, a, img, and form to structure content. The form tag is critical for web applications because it sends user input to servers. The action attribute specifies the URL, method specifies GET or POST, and the name attribute on inputs becomes the key when the server receives data."
        },
        {
            'title': 'How Databases Work',
            'topic': 'Data Storage',
            'content': "A relational database organizes data into tables with rows and columns. SQL (Structured Query Language) is used to communicate with databases. The four CRUD operations are: INSERT (add data), SELECT (retrieve data), UPDATE (modify data), DELETE (remove data). A primary key uniquely identifies each row. A foreign key links rows across tables. SQLite is file-based, PostgreSQL is server-based."
        },
        {
            'title': 'RAG - Retrieval Augmented Generation',
            'topic': 'AI Engineering',
            'content': "RAG combines information retrieval with text generation. Step 1: RETRIEVE - when a user asks a question, search documents for relevant information. Documents are split into chunks, converted to embeddings, and compared to the question embedding using cosine similarity. Step 2: AUGMENT - add the retrieved chunks to the prompt. Step 3: GENERATE - the LLM generates an answer using only the provided context."
        },
        {
            'title': 'Python Programming',
            'topic': 'Programming',
            'content': "Python is a high-level programming language known for readability. Variables store data with types like str, int, float, bool, list, dict. Functions are defined with def. Conditionals use if/elif/else. Loops use for and while. Python uses indentation for code blocks. It has extensive standard library and third-party packages available through pip."
        }
    ]

    def __init__(self):
        self.documents = self.SAMPLE_DOCUMENTS

    def chunk_text(self, text, chunk_size=300):
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - 50):
            chunk_text = ' '.join(words[i:i + chunk_size])
            if chunk_text.strip():
                chunks.append(chunk_text)
        return chunks

    def keyword_score(self, query, text):
        query = query.lower()
        text = text.lower()
        query_words = re.findall(r'\\w+', query)
        if not query_words:
            return 0.0
        matches = sum(1 for w in query_words if w in text)
        phrase_bonus = 0.3 if query in text else 0.0
        score = (matches / len(query_words)) * 0.7 + phrase_bonus
        return min(score, 1.0)

    def retrieve(self, query, top_k=3):
        all_chunks = []
        for doc in self.documents:
            for chunk_text in self.chunk_text(doc['content']):
                all_chunks.append({**doc, 'text': chunk_text})
        scored = []
        for chunk in all_chunks:
            score = self.keyword_score(query, chunk['text'])
            scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        seen = set()
        for score, chunk in scored:
            key = chunk['text'][:50]
            if key not in seen:
                seen.add(key)
                results.append({
                    'doc_title': chunk['title'],
                    'doc_topic': chunk['topic'],
                    'text': chunk['text'][:400],
                    'score': round(score, 3)
                })
            if len(results) >= top_k:
                break
        return results

    def generate_answer(self, query, chunks):
        if not chunks:
            return "I couldn't find relevant information. Try asking about Flask, HTML, databases, RAG, or Python."
        best = chunks[0]
        if best['score'] > 0.4:
            return f"Based on '{best['doc_title']}':\\n\\n{best['text'][:600]}"
        elif best['score'] > 0.15:
            return f"Found some possibly relevant info from '{best['doc_title']}':\\n\\n{best['text'][:400]}"
        else:
            return f"Here's the closest match from '{best['doc_title']}':\\n\\n{best['text'][:300]}"

    def ask(self, query):
        chunks = self.retrieve(query)
        answer = self.generate_answer(query, chunks)
        return {'chunks': chunks, 'answer': answer}
