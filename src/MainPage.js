import React from 'react';
import './MainPage.css';
import umd from './files/umd.png';
import agora from './files/agora.png';
import git from './files/git.png';
import mukund from './files/mukund.jpg';
import resume from './files/resume.pdf';
import balloon from './files/balloons.jpeg';

function App() {
    return (
        <div className="container">
            <div className="personal-info">
                <div className="personal-text">
                    <h1>Mukund Shankar</h1>
                    <p>I am a Senior Computer Science + Math major undergraduate at the University of Maryland, College Park.
                        I do cool research with <a href="https://www.cs.umd.edu/~abhinav/" target="_blank" rel="noopener noreferrer">Dr. Abhinav Shrivastava</a> involving deep learning and machine learning models.
                        Find more information in the projects section of this page.
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
                    <img src={umd} alt="UMD Research" />
                    <div>
                        <h3>Undergraduate Researcher</h3>
                        <span className="date">July 2023 - Present</span>
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

            <div className="coursework">
                <h2>BS. Computer Science (Hons.) + Mathematics. Robotics & Autonomous Systems Minor</h2>
                Below, you can find a list of relevant coursework.<br></br> <br></br>
                <div className="course-grid">
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
                    <div>CMSC420 - Data Structures</div>
                    <div>MATH410 - Advanced Calculus</div>
                    <div>CMSC351 - Algorithms</div>
                    <div><a href="https://bakalian.cs.umd.edu/330/syllabus" target="_blank" rel="noopener noreferrer">CMSC330 - Organization of Programming Languages</a></div>
                    <div>CMSC320 - Data Science</div>
                    <div>MATH240 - Introduction to Linear Algebra</div>
                    <div>MATH246 - Differential Equations</div>
                    <div>MATH241 - Multivariate Calculus</div>
                    <div>CMSC216 - Introduction to Computer Systems</div>
                    <div>CMSC250 - Discrete Systems</div>
                    <div>CMSC132 - Object Oriented Programming II</div>
                </div>
            </div>
        </div>
    );
}

export default App;