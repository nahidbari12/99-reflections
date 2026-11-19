// /src/components/Checkers.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Checkers.css";

const initialBoard = () => {
  const board = [];
  for (let row = 0; row < 8; row++) {
    const currentRow = [];
    for (let col = 0; col < 8; col++) {
      // pieces only on dark squares
      if ((row + col) % 2 !== 0) {
        if (row < 3) currentRow.push("b"); // CPU pieces
        else if (row > 4) currentRow.push("r"); // Player pieces
        else currentRow.push(null);
      } else currentRow.push(null);
    }
    board.push(currentRow);
  }
  return board;
};

const Checkers = ({ quizCompleted }) => {
  const navigate = useNavigate();
  const [board, setBoard] = React.useState(initialBoard);

  if (!quizCompleted) {
    return (
      <div className="checkers-container">
        <div className="arabic-calligraphy">أسماء الحسنى</div>
        <div className="checkers-title">Asma’ul Husna</div>
        <div className="quiz-blocked-message">
          <p>You must complete the Checkers quiz before playing.</p>
          <button
            className="go-to-quiz-button"
            onClick={() => navigate("/gamer-mode/checkers-quiz")}
          >
            Go to Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkers-container">
      <div className="arabic-calligraphy">أسماء الحسنى</div>
      <div className="checkers-title">Asma’ul Husna</div>
      <div className="checkers-board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`checkers-cell ${
                (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
              }`}
            >
              {cell && (
                <div
                  className={`checkers-piece ${cell === "r" ? "red" : "black"}`}
                ></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Checkers;
