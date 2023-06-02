import './MainPage.css';
import resume from './files/resume.pdf';
import balloon from './files/balloons.jpeg';
import umd from './files/umd.png';
import arnold from './files/arnold.png'
import git from './files/git.png';

function App() {
    return (
        <div>

            {/* Name and 'window' with description, ADD NAVBAR HERE */}
            <div class="top">
                <div class="header">
                    <div class="ribbon">
                        <div class="dot-red"></div>
                        <div class="dot-amber"></div>
                        <div class="dot-green"></div>
                    </div>
                    <div class="name">
                        <h1>Mukund Shankar</h1>
                    </div>
                    <div class="personal-description">
                        <p1>Welcome to my portfolio. I am Mukund Shankar, a junior Computer Science + Math major at the
                            University of Maryland, where I am focusing on machine learning. Below, you can find some more
                            information on my experiences, the projects I have been involved in, and classes I have taken.
                            <br></br>Thanks for visiting :)
                        </p1>
                    </div>
                </div>
            </div>

            {/* Experiences */}
            <div class="experiences-section">
                <h1>Experiences & Projects</h1>
                <div class="experiences-container">
                    <div class="experience">
                        <div class="ribbon">
                            <div class="dot-red"></div>
                            <div class="dot-amber"></div>
                            <div class="dot-green"></div>
                        </div>
                        <div class="exp-text">
                            <h2>Undergraduate Teaching Assistant</h2>
                            <p>Undergraduate Teaching Assistant for the Computer Science program's Object-Oriented Programming I and II
                                courses (CMSC131 & CMSC132).<br></br>
                            </p>

                            <img src={umd} alt="University of Maryland" />

                            <p>
                                Responsibilities included leading discussion classes for ~30 students,
                                preparing class materials, proctoring weekly quizzes, and holding office hours to help students with any
                                questions about class material and projects.
                                <br></br><br></br>
                                Duration: August 2022 - Current
                            </p>
                            <p><strong>Skills: </strong>Java, teaching, communication, organization</p>
                        </div>
                    </div>
                    <div class="experience">
                        <div class="ribbon">
                            <div class="dot-red"></div>
                            <div class="dot-amber"></div>
                            <div class="dot-green"></div>
                        </div>
                        <div class="exp-text">
                            <h2>ArnoldAI</h2>
                            <p>Developed an app which uses Natural Language Processing to generate curated daily meal plans for users
                                based on input text.<br></br>Used Amazon SageMaker to train and deploy model on our API, and used MongoDB
                                to store data to retrain model on.<br></br>iOS app development underway.
                            </p>

                            <img src={arnold} alt="ArnoldAI" />

                            <a href="https://master.d1frbpmrrocpzu.amplifyapp.com" target="_blank">Link to website</a>
                            <p><strong>Skills: </strong>Large Language Models, React, Express, MongoDB, AWS (SageMaker)</p>
                        </div>
                    </div>
                    <div class="experience">
                        <div class="ribbon">
                            <div class="dot-red"></div>
                            <div class="dot-amber"></div>
                            <div class="dot-green"></div>
                        </div>
                        <div class="exp-text">
                            <h2>Aerial Object Detector</h2>
                            <p>Developed a computer vision model which uses YOLOv5 and transfer learning to
                                detect balloons in images and videos.<br></br>
                            </p>

                            <img src={balloon} alt="Project 1" />

                            <p1>This won first place in the Northrop Grumman Hack Week Contest in 2023</p1>
                            <p><strong>Skills: </strong>PyTorch, matplotlib, seaborn, YOLOv5</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="education-section">
                <h1>Education - BS. Computer Science (Hons) + Mathematics</h1>
                <h2>Robotics & Autonomous Systems minor</h2>
                <div class="course-grid">
                    <div class="course">MATH410 - Advanced Calculus</div>
                    {/* <div class="course">CMSC422 - Machine Learning</div> */}
                    {/* <div class="course">CMSC426 - Computer Vision</div> */}
                    {/* <div class="course">ENME480 - Introduction to Robotics</div> */}
                    {/* <div class="course">CMSC420 - Data Structures</div> */}
                    {/* <div class="course">STAT410 - Introduction to Probability Theory</div> */}
                    <div class="course">CMSC351 - Algorithms</div>
                    <div class="course">CMSC330 - Organization of Programming Languages</div>
                    <div class="course">CMSC320 - Data Science</div>
                    <div class="course">MATH240 - Introduction to Linear Algebra</div>
                    <div class="course">STAT400 - Applied Statistics & Probability I</div>
                    <div class="course">MATH246 - Differential Equations</div>
                    <div class="course">MATH241 - Multivariate Calculus</div>
                    <div class="course">CMSC216 - Introduction to Computer Systems</div>
                    <div class="course">CMSC250 - Discrete Systems</div>
                    <div class="course">CMSC132 - Object Oriented Programming II</div>
                </div>
            </div>

            <div class="contact-section">
                <div class="head">
                    <h1>Contact & Resume</h1>
                </div>
                <div class="top">
                    <div class="header">
                        <div class="ribbon">
                            <div class="dot-red"></div>
                            <div class="dot-amber"></div>
                            <div class="dot-green"></div>
                        </div>
                        <div class="email">
                            <p>Phone: 240-413-1166</p>
                            <p>Email: <a href="mailto:smukund23@gmail.com" target="_blank">smukund23@gmail.com</a> </p>
                            <p></p><a id="download" href={resume} download>Download Resume</a>
                            <p></p><a href="https://www.github.com/mukundshankar-dev" target="_blank">GitHub</a>
                            <p></p><a href="https://www.linkedin.com/in/mukund~shankar/" target="_blank">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default App;