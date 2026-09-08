import React from 'react';
import './MainPage.css';
import umd from './files/umd.png';
import agora from './files/agora.png';
import git from './files/git.png';
import mukund from './files/mukund.jpg';
import resume from './files/resume.pdf';
import balloon from './files/balloons.jpeg';
import juume from './files/juume.png';
import nlp_report from './files/723_report.pdf';
import tool_call_report from './files/tool_call_report.pdf';

function App() {
    return (
        <main className="container" id="main-content">
            <div className="personal-info">
                <div className="personal-text">
                    <h1>Mukund Shankar</h1>
                    <p>
                       I'm a Computer Science master's student at the University of Maryland, graduating in December 2026. I build and evaluate machine learning systems, from language-model confidence probes and production RAG pipelines to robot learning with DexVision.
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
                <h2>Experiences/Projects</h2>
                <div className="experience-item">
                    <img src={git} alt="" />
                    <div>
                        <h3><a href="/projects/dexvision/">DexVision</a></h3>
                        <span className="date">June 2026 - Present</span>
                        <ul className="experience-bullets">
                            <li>Building toward an LLM-orchestrated robot that turns requests like “put this part on the inspection pad and press Start” into sequences of reusable manipulation skills.</li>
                            <li>Developing reach, pick, place, push, and button-press skills for a simulated Shadow Hand in MuJoCo, with the goal of reusing them across workspace clearing, inspection, and setup tasks.</li>
                            <li>Building a diverse demonstration dataset and PyTorch imitation-learning pipeline to train and evaluate these skills, then connect visual perception and an LLM planner through a supervised execution interface.</li>
                        </ul>
                        <div className="project-links">
                            <a href="/projects/dexvision/">Read the project journal →</a>
                            <a href="https://github.com/MukundShankar-dev/DexVision" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                        </div>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={git} alt="" />
                    <div>
                        <h3>Diagnosing Tool-Call Decision Making in Small Language Models</h3>
                        <span className="date">February 2026 - May 2026</span>
                        <ul className="experience-bullets">
                            <li>Investigated when small language models should call a tool, request more information, or abstain, benchmarking prompting, SFT, DPO, and Constitutional AI-style supervision on When2Call.</li>
                            <li>Improved tool-call decision accuracy over zero-shot baselines with SFT and CAI-DPO.</li>
                            <li>Trained linear probes showing that correct tool-use decisions are often recoverable from hidden states even when final outputs are incorrect.</li>
                        </ul>
                        <div className="project-links">
                            <a href={tool_call_report} target="_blank" rel="noopener noreferrer">Read the report</a>
                            <a href="https://github.com/anirudhporuri/tool-call-decision-making/" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                        </div>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={git} alt="" />
                    <div>
                        <h3>Confidence Probes for Language Models</h3>
                        <span className="date">September 2025 - December 2025</span>
                        <ul className="experience-bullets">
                            <li>Developed lightweight MLP classifiers using hidden states, entropy, and layer trajectories to predict when language models will answer correctly.</li>
                            <li>Trained probes achieving 90% accuracy and 0.97 AUC-ROC across 424K examples spanning TriviaQA, HotpotQA, SQuAD v2, GSM8K, and MMLU.</li>
                            <li>Evaluated cross-dataset and cross-model transfer, identifying threshold brittleness and task mismatch as key failure modes under distribution shift.</li>
                        </ul>
                        <div className="project-links">
                            <a href={nlp_report} target="_blank" rel="noopener noreferrer">Read the report</a>
                            <a href="https://github.com/MukundShankar-dev/Confidence-Probes-For-LMs" target="_blank" rel="noopener noreferrer">Code on GitHub</a>
                        </div>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={juume} alt="JuumeAI" />
                    <div>
                        <h3>Machine Learning Engineer Intern · JuumeAI</h3>
                        <span className="date">April 2025 - September 2025</span>
                        <ul className="experience-bullets">
                            <li>Built a PostgreSQL/pgvector RAG system for 10K+ documents, using LLM semantic chunking and automated ingestion to improve BERTScore by 17% over direct LLM baselines.</li>
                            <li>Accelerated document indexing by 5× through multithreading and autoscaling on Google Cloud Run.</li>
                            <li>Developed an evaluation framework using BERTScore, RAGAS, and coverage metrics to validate retrieval grounding and measure performance across pipeline stages.</li>
                        </ul>
                        <a href="https://www.juume.ai/" target="_blank" rel="noopener noreferrer">More about JuumeAI</a>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={umd} alt="UMD Research" />
                    <div>
                        <h3>Undergraduate Researcher</h3>
                        <span className="date">July 2023 - November 2025</span>
                        Worked in <a href="https://www.cs.umd.edu/~abhinav/" target="_blank" rel="noopener noreferrer">Dr. Abhinav Shrivastava's</a> group at the University of Maryland.
                        <ul className="experience-bullets">
                            <li>Developed a transformer-based model for retrieving SMPL skeletal human motions from text, achieving 90% R@1 on KIT-ML and HumanML3D.</li>
                            <li>Extended motion/text retrieval to RGB videos using keypoint detection and SAM tracking, testing the end-to-end pipeline on 39,000 videos.</li>
                        </ul>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={agora} alt="Agora" />
                    <div>
                        <h3>agora.</h3>
                        Developed an app which uses Natural Language Processing to generate curated daily meal plans based on text input from users.
                        <br></br>
                        <a href="https://www.cs.umd.edu/article/2023/10/umd-undergrads-revolutionize-meal-planning-innovative-app" target="_blank" rel="noopener noreferrer">Ft. in UMD Newsletter</a>
                        <br></br>
                        <a href="https://master.d1frbpmrrocpzu.amplifyapp.com/" target="_blank" rel="noopener noreferrer">Website</a>
                        <br></br>
                        <a href="https://apps.apple.com/us/app/agora/id6462011570?ign-itscg=30200&ign-itsct=apps_box_badge" target="_blank" rel="noopener noreferrer">On the app store</a>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={umd} alt="ta" />
                    <div>
                        <h3>Teaching Assistant</h3>
                        <span className="date">August 2022 - December 2023</span>
                        Undergraduate Teaching Assistant for the Computer Science program's Object-Oriented Programming I and II courses (CMSC131 & CMSC132).
                        <br></br>
                        Responsibilities included leading discussion classes for ~30 students, preparing class materials, proctoring weekly quizzes, and holding office hours to help students with any questions about class material and projects.
                    </div>
                </div>
                <div className="experience-item">
                    <img src={balloon} alt="Aerial Object Detector" />
                    <div>
                        <h3>Aerial Object Detector</h3>
                        <span className="date">February 2023</span>
                        Developed a computer vision model which uses YOLOv5 and transfer learning to detect balloons in images and videos.
                        <br></br>
                        <a href="https://github.com/MukundShankar-dev/aerial-object-classification" target="_blank" rel="noopener noreferrer"> Visit the repository for documentation and info</a>
                        <br></br>
                        <span className="highlight">This project won first place in the Northrop Grumman Hack Week Contest in 2023</span>
                    </div>
                </div>
            </div>

            <div className="experiences">
                <h2>Education</h2>
                <div className="experience-item">
                    <img src={umd} alt="" />
                    <div>
                        <h3>M.S. in Computer Science · University of Maryland</h3>
                        <span className="date">Expected December 2026</span>
                        Graduate work in natural language processing, language models, and machine learning systems.
                    </div>
                </div>
                <div className="experience-item">
                    <img src={umd} alt="UMD" />
                    <div>
                        <h3>University of Maryland, College Park</h3>
                        <span className="date">September 2021 - May 2025</span>
                        Bachelor of Science double degree in Computer Science and Mathematics with a Minor in Robotics and Autonomous Systems. Specialized in Machine Learning. 
                        See relevant coursework below.
                    </div>
                </div>
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
