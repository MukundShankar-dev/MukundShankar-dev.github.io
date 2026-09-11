import juume from '../files/juume.png';
import umd from '../files/umd.png';

// Explicit editorial order, by start date. Current research stays in Intro only.
export const experiences = [
    {
        id: 'juume', title: 'Machine Learning Engineer Intern', organization: 'JuumeAI',
        date: 'Apr–Sep 2025', logo: juume,
        bullets: [
            'Built and owned a production PostgreSQL/pgvector RAG system spanning 10K+ documents, including automated ingestion, semantic chunking, retrieval APIs, and deployment on Google Cloud Run; improved BERTScore 17% over direct LLM baselines.',
            'Reduced indexing time 5× through multithreading and autoscaling, and built CI/CD, health checks, monitoring, and stage-wise evaluation for diagnosing retrieval failures and hallucinations.',
        ],
        links: [{ label: 'More about JuumeAI', href: 'https://www.juume.ai/' }],
    },
    {
        id: 'umd-research', title: 'Undergraduate Researcher', organization: 'University of Maryland',
        date: 'Jul 2023 – Nov 2025', logo: umd,
        bullets: [
            'Developed a transformer-based model for retrieving SMPL skeletal human motions from text, achieving 90% R@1 on KIT-ML and HumanML3D.',
            'Extended motion/text retrieval to RGB video using keypoint detection and SAM tracking, testing the end-to-end system on 39,000 videos.',
        ],
        links: [{ label: "Dr. Abhinav Shrivastava’s group", href: 'https://www.cs.umd.edu/~abhinav/' }],
    },
    {
        id: 'teaching', title: 'Teaching Assistant', organization: 'University of Maryland',
        date: 'Aug 2022 – Dec 2023', logo: umd, quieter: true,
        bullets: [
            'Led discussion sections for approximately 30 students in Object-Oriented Programming I and II (CMSC131 & CMSC132).',
            'Prepared teaching materials and held office hours to help students understand programming concepts and work through course projects.',
        ],
    },
];
