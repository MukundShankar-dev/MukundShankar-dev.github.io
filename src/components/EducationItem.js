export default function EducationItem() {
    return (
        <div className="education-item">
            <h3>University of Maryland, College Park</h3>
            <p className="degree"><span>M.S. Computer Science</span><span className="date">Expected Dec 2026</span></p>
            <p className="degree"><span>B.S. Computer Science &amp; B.S. Mathematics</span><span className="date">May 2025</span></p>
            <p className="education-note">Minor in Robotics &amp; Autonomous Systems</p>
            <p className="coursework">Selected graduate coursework: <a href="https://www.cs.umd.edu/~miyyer/cmsc723/" target="_blank" rel="noopener noreferrer">NLP</a> · <a href="https://www.cs.umd.edu/~miyyer/cmsc848o/" target="_blank" rel="noopener noreferrer">Long-Context Language Models</a> · <a href="https://www.cs.umd.edu/class/spring2025/cmsc828g/lectures.shtml" target="_blank" rel="noopener noreferrer">Systems for ML</a> · <a href="https://users.umiacs.umd.edu/~ying/teaching/CMSC_848/" target="_blank" rel="noopener noreferrer">Good AI Answers to Questions</a></p>
        </div>
    );
}
