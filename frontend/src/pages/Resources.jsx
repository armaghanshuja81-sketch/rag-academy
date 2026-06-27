const YOUTUBE_CHANNELS = [
  {
    name: 'James Briggs',
    url: 'https://www.youtube.com/@jamesbriggs',
    description: 'Excellent tutorials on embeddings, vector search, and RAG systems.',
    icon: '🎥',
  },
  {
    name: 'Data Independent',
    url: 'https://www.youtube.com/@DataIndependent',
    description: 'Deep dives into LangChain, LlamaIndex, and RAG pipelines.',
    icon: '📺',
  },
  {
    name: 'Sam Witteveen',
    url: 'https://www.youtube.com/@SamWitteveen',
    description: 'Practical AI and machine learning tutorials with code.',
    icon: '🎬',
  },
  {
    name: 'Prompt Engineering',
    url: 'https://www.youtube.com/@engineerprompt',
    description: 'Advanced prompting techniques and RAG optimization.',
    icon: '📹',
  },
];

const FREE_COURSES = [
  {
    name: 'LangChain for LLM Application Development',
    url: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/',
    description: 'DeepLearning.AI short course on building apps with LangChain.',
    icon: '💻',
  },
  {
    name: 'Building and Evaluating Advanced RAG',
    url: 'https://www.deeplearning.ai/short-courses/advanced-retrieval-for-ai/',
    description: 'Learn advanced retrieval techniques for RAG systems.',
    icon: '🔬',
  },
  {
    name: 'Vector Databases: from Embeddings to Applications',
    url: 'https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/',
    description: 'Understand vector databases and embedding applications.',
    icon: '🗂️',
  },
  {
    name: 'Hugging Face NLP Course',
    url: 'https://huggingface.co/learn/nlp-course/',
    description: 'Comprehensive NLP course covering transformers and embeddings.',
    icon: '🤗',
  },
];

const TUTORIALS = [
  {
    name: 'LlamaIndex Documentation',
    url: 'https://docs.llamaindex.ai/',
    description: 'Official docs for the LlamaIndex RAG framework.',
    icon: '🦙',
  },
  {
    name: 'LangChain Documentation',
    url: 'https://python.langchain.com/docs/',
    description: 'Official LangChain documentation and guides.',
    icon: '⛓️',
  },
  {
    name: 'Chroma DB Guide',
    url: 'https://docs.trychroma.com/',
    description: 'Open-source embedding database docs and tutorials.',
    icon: '📊',
  },
  {
    name: 'Pinecone Learning Center',
    url: 'https://www.pinecone.io/learn/',
    description: 'Articles and tutorials on vector search and RAG.',
    icon: '🌲',
  },
  {
    name: 'OpenAI Cookbook',
    url: 'https://cookbook.openai.com/',
    description: 'Official OpenAI examples including RAG patterns.',
    icon: '🤖',
  },
  {
    name: 'Weaviate Blog',
    url: 'https://weaviate.io/blog',
    description: 'Vector database tutorials and RAG how-tos.',
    icon: '📝',
  },
];

function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="clay-card clay-card--sm"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div className="clay-flex clay-items-center clay-gap-sm">
        <span style={{ fontSize: '1.5rem' }}>{resource.icon}</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>{resource.name}</h4>
          <p className="clay-text-xs clay-text-muted">{resource.description}</p>
        </div>
      </div>
    </a>
  );
}

export default function Resources() {
  return (
    <div className="clay-container">
      <section className="clay-hero">
        <h1>Resources</h1>
        <p>
          Curated list of the best free resources to deepen your
          understanding of RAG, embeddings, and vector databases.
        </p>
      </section>

      {/* YouTube Channels */}
      <section className="clay-mb-lg">
        <h2 className="clay-mb-md">YouTube Channels</h2>
        <div className="clay-grid-2">
          {YOUTUBE_CHANNELS.map((channel) => (
            <ResourceCard key={channel.name} resource={channel} />
          ))}
        </div>
      </section>

      {/* Free Courses */}
      <section className="clay-mb-lg">
        <h2 className="clay-mb-md">Free Courses</h2>
        <div className="clay-grid-2">
          {FREE_COURSES.map((course) => (
            <ResourceCard key={course.name} resource={course} />
          ))}
        </div>
      </section>

      {/* Tutorials & Docs */}
      <section className="clay-mb-lg">
        <h2 className="clay-mb-md">Tutorials & Documentation</h2>
        <div className="clay-grid-3">
          {TUTORIALS.map((tutorial) => (
            <ResourceCard key={tutorial.name} resource={tutorial} />
          ))}
        </div>
      </section>
    </div>
  );
}
