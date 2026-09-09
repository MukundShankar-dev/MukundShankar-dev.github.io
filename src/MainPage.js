import React from 'react';
import './MainPage.css';
import umd from './files/umd.png';
import agora from './files/agora.png';
import toolCallPreview from './files/tool-call-probes.png';
import confidencePreview from './files/confidence-probe-roc.png';
import mukund from './files/mukund.jpg';
import resume from './files/resume.pdf';
import balloon from './files/balloons.jpeg';
import juume from './files/juume.png';
import nlp_report from './files/723_report.pdf';
import tool_call_report from './files/tool_call_report.pdf';

function Experience({ title, date, status, image, imageAlt = '', preview, children }) {
    const titleId = React.useId();
    return (
        <article className={`experience-item${preview ? ' project-item' : ''}`} aria-labelledby={titleId}>
            <header className="experience-heading">
                <h3 id={titleId}>{title}</h3>
                {date && <span className="date">{date}{status && <> · <span className="project-status">{status}</span></>}</span>}
            </header>
            {preview || <img className="experience-logo" src={image} alt={imageAlt} loading="lazy" />}
            <div className="experience-content">{children}</div>
        </article>
    );
}

function App() {
    return (
        <main className="container" id="main-content">
            <div className="personal-info">
                <div className="personal-text">
                    <h1>Mukund Shankar</h1>
                    <p>
                       I'm a Computer Science master's student at the University of Maryland, graduating in December 2026. I build and evaluate machine learning systems: production RAG pipelines, LLM post-training and confidence estimation, and robot learning with DexVision.
                    </p>
                    <div className="links">
                        <a href="mailto:smukund23@gmail.com">Email</a>
                        <a href={resume} target="_blank" rel="noopener noreferrer">Resume</a>
                        <a href="https://www.linkedin.com/in/mukundsh" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        <a href="https://github.com/mukundshankar-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
                    </div>
                </div>
                <div className="personal-image">
                    <img src={mukund} alt="Mukund Shankar" />
                </div>
            </div>

            <div className="experiences" id="projects">
                <h2>Experience &amp; Projects</h2>
                <Experience title={<a href="/projects/dexvision/">DexVision</a>} date="June 2026 - Present" status="In progress" preview={
                    <figure className="project-preview">
                        <a href="/projects/dexvision/" aria-label="Explore DexVision in the project journal">
                            <img src="/projects/dexvision/images/lift.png" alt="Simulated Shadow Hand lifting a block in the DexVision workcell" width="1200" height="800" loading="lazy" />
                        </a>
                        <figcaption>Pick-and-place in MuJoCo</figcaption>
                    </figure>
                }>
                    <ul className="experience-bullets">
                        <li>Building toward an LLM-orchestrated robot that combines reusable skills to follow instructions such as “place a part and press Start.”</li>
                        <li>Developing a demonstration dataset and PyTorch imitation-learning pipeline to train and validate reach, pick-and-place, push, and button-press skills for a Shadow Hand in MuJoCo.</li>
                        <li>Planning visual perception and supervised execution to reuse these skills across inspection and workspace-setup tasks.</li>
                    </ul>
                    <div className="project-links">
                        <a href="/projects/dexvision/">Read the project journal →</a>
                        <a href="https://github.com/MukundShankar-dev/DexVision" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                    </div>
                </Experience>
                <Experience title="Tool-Calling Decisions in Small LLMs" date="February 2026 - May 2026" preview={
                    <figure className="project-preview">
                        <a href={toolCallPreview} target="_blank" rel="noopener noreferrer" aria-label="View the tool-call probe accuracy chart at full size">
                            <img src={toolCallPreview} alt="When2Call probe accuracy across layers for Gemma and Llama models" width="1600" height="933" loading="lazy" />
                        </a>
                        <figcaption>Tool-use decisions across layers · <a href={toolCallPreview} target="_blank" rel="noopener noreferrer">Enlarge ↗</a></figcaption>
                    </figure>
                }>
                        <ul className="experience-bullets">
                            <li>Benchmarked prompting, LoRA fine-tuning, and preference optimization for deciding when small LLMs should call tools, ask for clarification, or abstain.</li>
                            <li>Raised Llama-3.2-3B’s When2Call decision accuracy from <strong>47.1% to 79.9%</strong> with supervised fine-tuning; evaluated on 3,652 test examples.</li>
                            <li>Probed hidden states for correct decisions missed by model outputs; audited Constitutional AI-style training data for fabricated arguments and unsupported tool calls.</li>
                        </ul>
                        <div className="project-links">
                            <a href={tool_call_report} target="_blank" rel="noopener noreferrer">Read the report</a>
                            <a href="https://github.com/anirudhporuri/tool-call-decision-making/" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                        </div>
                </Experience>
                <Experience title="Confidence Probes for Language Models" date="September 2025 - December 2025" preview={
                    <figure className="project-preview">
                        <a href={confidencePreview} target="_blank" rel="noopener noreferrer" aria-label="View the confidence-probe ROC curve at full size">
                            <img src={confidencePreview} alt="Qwen 2.5 7B confidence probe on TriviaQA: ROC curve with AUC 0.953" width="1050" height="750" loading="lazy" />
                        </a>
                        <figcaption>Qwen 2.5 7B · TriviaQA ROC · <a href={confidencePreview} target="_blank" rel="noopener noreferrer">Enlarge ↗</a></figcaption>
                    </figure>
                }>
                        <ul className="experience-bullets">
                            <li>Designed and built the feature-collection, training, and evaluation pipeline for LLM confidence probes, using a 424K-example corpus across five QA and reasoning benchmarks.</li>
                            <li>Trained MLPs on hidden states and token probabilities to estimate answer correctness: <strong>0.953 ROC-AUC on held-out TriviaQA</strong> with Qwen-2.5-7B.</li>
                            <li>Evaluated transfer across tasks and model sizes, identifying failures caused by task mismatch and miscalibrated decision thresholds.</li>
                        </ul>
                        <div className="project-links">
                            <a href={nlp_report} target="_blank" rel="noopener noreferrer">Read the report</a>
                            <a href="https://github.com/MukundShankar-dev/Confidence-Probes-For-LMs" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                        </div>
                </Experience>
                <Experience title="Machine Learning Engineer Intern · JuumeAI" date="April 2025 - September 2025" image={juume} imageAlt="JuumeAI">
                    <ul className="experience-bullets">
                        <li>Built a PostgreSQL/pgvector RAG system for <strong>10K+ documents</strong>, combining semantic chunking and automated ingestion to improve BERTScore by 17% over then-frontier LLM baselines without retrieval.</li>
                        <li>Accelerated document indexing by <strong>5×</strong> through multithreading and autoscaling on Google Cloud Run.</li>
                        <li>Built a BERTScore, RAGAS, and coverage evaluation framework to check retrieval grounding and diagnose pipeline performance.</li>
                    </ul>
                    <div className="project-links">
                        <a href="https://www.juume.ai/" target="_blank" rel="noopener noreferrer">More about JuumeAI</a>
                    </div>
                </Experience>
                <Experience title="Undergraduate Researcher · University of Maryland" date="July 2023 - November 2025" image={umd} imageAlt="University of Maryland">
                        Worked in <a href="https://www.cs.umd.edu/~abhinav/" target="_blank" rel="noopener noreferrer">Dr. Abhinav Shrivastava's</a> group at the University of Maryland.
                        <ul className="experience-bullets">
                            <li>Developed a transformer-based model for retrieving SMPL skeletal human motions from text, achieving 90% R@1 on KIT-ML and HumanML3D.</li>
                            <li>Extended motion/text retrieval to RGB videos using keypoint detection and SAM tracking, testing the end-to-end pipeline on 39,000 videos.</li>
                        </ul>
                </Experience>
                <Experience title="agora." image={agora} imageAlt="Agora">
                    <ul className="experience-bullets">
                        <li>Developed a meal-planning app that uses natural language processing to turn users’ text input into curated daily meal plans.</li>
                    </ul>
                    <div className="project-links">
                        <a href="https://www.cs.umd.edu/article/2023/10/umd-undergrads-revolutionize-meal-planning-innovative-app" target="_blank" rel="noopener noreferrer">Featured at UMD</a>
                        <a href="https://master.d1frbpmrrocpzu.amplifyapp.com/" target="_blank" rel="noopener noreferrer">Website</a>
                        <a href="https://apps.apple.com/us/app/agora/id6462011570?ign-itscg=30200&ign-itsct=apps_box_badge" target="_blank" rel="noopener noreferrer">App Store</a>
                    </div>
                </Experience>
                <Experience title="Teaching Assistant · University of Maryland" date="August 2022 - December 2023" image={umd} imageAlt="University of Maryland">
                    <ul className="experience-bullets">
                        <li>Led discussion sections for approximately 30 students in Object-Oriented Programming I and II (CMSC131 &amp; CMSC132).</li>
                        <li>Prepared teaching materials and held office hours to help students understand programming concepts and work through course projects.</li>
                    </ul>
                </Experience>
                <Experience title="Aerial Object Detector" date="February 2023" image={balloon} imageAlt="Aerial Object Detector">
                    <ul className="experience-bullets">
                        <li>Won <strong>first place</strong> in the 2023 Northrop Grumman Hack Week Contest.</li>
                        <li>Used YOLOv5 and transfer learning to detect balloons in images and videos.</li>
                    </ul>
                    <div className="project-links">
                        <a href="https://github.com/MukundShankar-dev/aerial-object-classification" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                    </div>
                </Experience>
            </div>

            <div className="experiences">
                <h2>Education</h2>
                <Experience title="M.S. in Computer Science · University of Maryland" date="Expected December 2026" image={umd}>
                        Graduate work in natural language processing, language models, and machine learning systems.
                </Experience>
                <Experience title="University of Maryland, College Park" date="September 2021 - May 2025" image={umd}>
                        Bachelor of Science double degree in Computer Science and Mathematics with a Minor in Robotics and Autonomous Systems. Specialized in Machine Learning. 
                        See relevant coursework below.
                </Experience>
            </div>

            <div className="coursework">
                <h2>Selected Coursework</h2>
                <p>Graduate and undergraduate courses in machine learning, language, mathematics, and robotics.</p>
                <div className="course-grid">
                    <div><a href="https://users.umiacs.umd.edu/~ying/teaching/CMSC_848/" target="_blank" rel="noopener noreferrer">CMSC848Q - Good AI Answers To Questions</a></div>
                    <div><a href="https://www.cs.umd.edu/~miyyer/cmsc723/" target="_blank" rel="noopener noreferrer">CMSC723 - Natural Language Processing</a></div>
                    <div><a href="https://www.cs.umd.edu/~miyyer/cmsc848o/" target="_blank" rel="noopener noreferrer">CMSC848O - Long Context Language Models</a></div>
                    <div><a href="https://www.cs.umd.edu/class/spring2025/cmsc828g/lectures.shtml" target="_blank" rel="noopener noreferrer">CMSC828G - Systems for ML</a></div>

                    <div><a href="https://www.cs.umd.edu/class/spring2024/cmsc472/" target="_blank" rel="noopener noreferrer">CMSC472 - Intro to Deep Learning</a></div>
                    <div><a href="https://www.cs.umd.edu/class/fall2024/cmsc422-0101/" target="_blank" rel="noopener noreferrer">CMSC422 - Intro to ML</a></div>
                    <div>CMSC421 - Intro to AI</div>
                    <div><a href="https://cmsc426.github.io/" target="_blank" rel="noopener noreferrer">CMSC426 - Computer Vision</a></div>
                    <div>STAT420 - Theory and Methods of Statistics</div>
                    <div>MATH401 - Applications of Linear Algebra</div>
                    <div>AMSC466 - Numerical Analysis</div>
                    <div>ENEE467 - Robotics Project Laboratory</div>
                    <div>ENAE450 - Robotics Programming</div>
                    <div>ENME480 - Introduction to Robotics</div>
                </div>
            </div>
        </main>
    );
}

export default App;
