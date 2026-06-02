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
        <div className="container">
            <div className="personal-info">
                <div className="personal-text">
                    <h1>Mukund Shankar</h1>
                    <p>
                       I'm a graduate student in Computer Science at the University of Maryland. My work focuses on building reliable AI systems from confidence estimation in language models to production RAG pipelines and multimodal transformers. I'm particularly interested in preventing model hallucinations, creating robust evaluation frameworks, and deploying ML systems that work reliably at scale. 
                    </p>
                    <div className="links">
                        <a href="mailto:smukund@gmail.com" target="_blank" rel="noopener noreferrer">Email</a>
                        <a href={resume} target="_blank" rel="noopener noreferrer">Resume</a>
                        <a href="https://www.linkedin.com/in/mukundsh" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        <a href="https://github.com/mukundshankar-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
                    </div>
                </div>
                <div className="personal-image">
                    <img src={mukund} alt="Mukund Shankar" />
                </div>
            </div>

            <div className="experiences">
                <h2>Experiences/Projects</h2>
                <div className="experience-item">
                    <img src={git} alt="NLP Report" />
                    <div>
                        <h3>Diagnozing Tool-Call Decision Making in Small Language Models</h3>
                        <span className="date">February 2026 - May 2026</span>
                        Developed a tool-call decision framework for small LMs that benchmarks prompting, SFT, DPO, and Constitutional AI-style supervision on When2Call. Improved decision accuracy over zero-shot baselines with SFT and CAI-DPO, and trained linear probes showing correct tool-use decisions are often recoverable from hidden states even when final outputs are incorrect.
                        <br></br>
                        <a href={tool_call_report} target="_blank" rel="noopener noreferrer">Read the full report here</a>
                        <br></br>
                        <a href="https://github.com/anirudhporuri/tool-call-decision-making/" target="_blank" rel="noopener noreferrer"> View the code repository here</a>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={git} alt="NLP Report" />
                    <div>
                        <h3>Confidence Probes for Language Models</h3>
                        <span className="date">September 2025 - December 2025</span>
                        Developed lightweight MLP classifiers that use internal model signals (hidden states, entropy, layer trajectories) to predict when LLMs will answer correctly. Trained probes achieving 90% accuracy and 0.97 AUC-ROC across 400K+ examples spanning TriviaQA, HotpotQA, SQuAD v2, GSM8K, and MMLU. Evaluated cross-dataset and cross-model transfer, analyzing threshold brittleness and task mismatch as key failure modes under distribution shift.
                        <br></br>
                        <a href={nlp_report} target="_blank" rel="noopener noreferrer">Read the full report here</a>
                        <br></br>
                        <a href="https://github.com/MukundShankar-dev/Confidence-Probes-For-LMs" target="_blank" rel="noopener noreferrer"> View the code repository here</a>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={juume} alt="JuumeAI" />
                    <div>
                        <h3>JuumeAI</h3>
                        <span className="date">April 2025 - September 2025</span>
                        Working as a Machine Learning Engineer at JuumeAI, designing and deploying production RAG systems on GCP. Developed end-to-end pipelines processing 10K+ documents with LLM-powered semantic chunking and automated ingestion. Built comprehensive evaluation framework using BERTScore, RAGAS, and Coverage metrics. Created versioned prompt repository to reduce hallucinations through retrieval-grounded validation. Optimized pipeline performance through autoscaling and multithreading, achieving 5x latency reduction and 17% BERTScore improvement over baseline.
                        <br></br>
                        <a href="https://www.juume.ai/" target="_blank" rel="noopener noreferrer">More about JuumeAI</a>
                    </div>
                </div>
                <div className="experience-item">
                    <img src={umd} alt="UMD Research" />
                    <div>
                        <h3>Undergraduate Researcher</h3>
                        <span className="date">July 2023 - November 2025</span>
                        Working in <a href="https://www.cs.umd.edu/~abhinav/" target="_blank" rel="noopener noreferrer">Dr. Abhinav Shrivastava's</a> group, developing a model to well condition a latent space between text and human motion representations,
                        training a model to be used for action classification. We are looking to submit this work for publication in Fall of 2024.
                        Worked on image processing using Intel RealSense depth cameras.
                    </div>
                </div>
                <div className="experience-item">
                    <img src={agora} alt="Agora" />
                    <div>
                        <h3>agora.</h3>
                        Developed an app which uses Natural Language Processing to generate curated daily meal plans based on text input from users.
                        <br></br>
                        <a href="https://www.cs.umd.edu/article/2023/10/umd-undergrads-revolutionize-meal-planning-innovative-app" target="_blank">Ft. in UMD Newsletter</a>
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
                <h1>M.S. Computer Science</h1>
                <h3>B.S. Computer Science (Hons.) + Mathematics. Robotics & Autonomous Systems Minor</h3>
                Below, you can find a list of relevant coursework.<br></br> <br></br>
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
        </div>
    );
}

export default App;