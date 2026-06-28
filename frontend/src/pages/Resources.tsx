interface Resource {
  name: string
  url: string
  description: string
  icon: string
}

const YOUTUBE_CHANNELS: Resource[] = [
  { name: 'James Briggs', url: 'https://www.youtube.com/@jamesbriggs', description: 'Embeddings, vector search, and RAG systems.', icon: '🎥' },
  { name: 'Data Independent', url: 'https://www.youtube.com/@DataIndependent', description: 'LangChain, LlamaIndex, and RAG pipelines.', icon: '📺' },
  { name: 'Sam Witteveen', url: 'https://www.youtube.com/@SamWitteveen', description: 'Practical AI and ML tutorials with code.', icon: '🎬' },
  { name: 'Prompt Engineering', url: 'https://www.youtube.com/@engineerprompt', description: 'Advanced prompting and RAG optimization.', icon: '📹' },
]

const FREE_COURSES: Resource[] = [
  { name: 'LangChain for LLM Apps', url: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/', description: 'DeepLearning.AI short course.', icon: '💻' },
  { name: 'Advanced RAG', url: 'https://www.deeplearning.ai/short-courses/advanced-retrieval-for-ai/', description: 'Advanced retrieval techniques.', icon: '🔬' },
  { name: 'Vector Databases', url: 'https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/', description: 'Embeddings and vector DB applications.', icon: '🗂️' },
  { name: 'Hugging Face NLP', url: 'https://huggingface.co/learn/nlp-course/', description: 'Transformers and embeddings course.', icon: '🤗' },
]

const TUTORIALS: Resource[] = [
  { name: 'LlamaIndex Docs', url: 'https://docs.llamaindex.ai/', description: 'Official LlamaIndex RAG framework docs.', icon: '🦙' },
  { name: 'LangChain Docs', url: 'https://python.langchain.com/docs/', description: 'Official LangChain guides.', icon: '⛓️' },
  { name: 'Chroma DB Guide', url: 'https://docs.trychroma.com/', description: 'Open-source embedding database.', icon: '📊' },
  { name: 'Pinecone Learn', url: 'https://www.pinecone.io/learn/', description: 'Vector search and RAG articles.', icon: '🌲' },
  { name: 'OpenAI Cookbook', url: 'https://cookbook.openai.com/', description: 'Official examples including RAG.', icon: '🤖' },
  { name: 'Weaviate Blog', url: 'https://weaviate.io/blog', description: 'Vector DB tutorials and how-tos.', icon: '📝' },
]

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url} target="_blank" rel="noopener noreferrer"
      className="clay-card clay-card--sm"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div className="clay-flex clay-items-center clay-gap-sm">
        <span className="clay-icon-lg">{resource.icon}</span>
        <div>
          <h4>{resource.name}</h4>
          <p className="clay-text-xs clay-text-muted">{resource.description}</p>
        </div>
      </div>
    </a>
  )
}

export default function Resources() {
  const sections: { title: string; items: Resource[]; cols: string }[] = [
    { title: 'YouTube Channels', items: YOUTUBE_CHANNELS, cols: 'clay-grid-2' },
    { title: 'Free Courses', items: FREE_COURSES, cols: 'clay-grid-2' },
    { title: 'Tutorials & Documentation', items: TUTORIALS, cols: 'clay-grid-3' },
  ]

  return (
    <div className="clay-reveal">
      <section className="clay-hero">
        <h1>Resources</h1>
        <p>Curated list of the best free resources to deepen your RAG knowledge.</p>
      </section>

      {sections.map(section => (
        <section key={section.title} className="clay-mb-lg">
          <h2 className="clay-mb-md">{section.title} ({section.items.length})</h2>
          <div className={section.cols}>
            {section.items.map(item => <ResourceCard key={item.name} resource={item} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
