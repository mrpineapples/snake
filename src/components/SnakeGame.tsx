import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

type Position = {
  x: number;
  y: number;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export default function SnakeGame() {
  const gridSize = 20;
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<Position | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('button')) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('button')) {
        e.preventDefault();
      }
      if (!touchStart || gameOver || isPaused) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && direction !== "LEFT") setDirection("RIGHT");
        else if (deltaX < 0 && direction !== "RIGHT") setDirection("LEFT");
      } else {
        if (deltaY > 0 && direction !== "UP") setDirection("DOWN");
        else if (deltaY < 0 && direction !== "DOWN") setDirection("UP");
      }

      setTouchStart(null);
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [direction, gameOver, isPaused, touchStart]);

  const generateFood = useCallback((): void => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    setFood(newFood);
  }, [snake, gridSize]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prevSnake: Position[]) => {
      const newSnake = [...prevSnake];
      const head: Position = { ...newSnake[0] };

      switch (direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      if (
        head.x < 0 ||
        head.x >= gridSize ||
        head.y < 0 ||
        head.y >= gridSize
      ) {
        setGameOver(true);
        return prevSnake;
      }

      if (
        newSnake
          .slice(1)
          .some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      if (head.x === food.x && head.y === food.y) {
        generateFood();
        setScore((prev) => prev + 1);
      } else {
        newSnake.pop();
      }

      newSnake.unshift(head);
      return newSnake;
    });
  }, [direction, food, gameOver, generateFood, gridSize, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      let newDirection: Direction | null = null;

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "DOWN") newDirection = "UP";
          break;
        case "ArrowDown":
          if (direction !== "UP") newDirection = "DOWN";
          break;
        case "ArrowLeft":
          if (direction !== "RIGHT") newDirection = "LEFT";
          break;
        case "ArrowRight":
          if (direction !== "LEFT") newDirection = "RIGHT";
          break;
      }

      if (newDirection) {
        setDirection(newDirection);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [direction, gameOver, isPaused]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, 150);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection("RIGHT");
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    generateFood();
  };

  const renderCell = (x: number, y: number) => {
    const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;
    const isTopLeft = x === 0 && y === 0;
    const isTopRight = x === gridSize - 1 && y === 0;
    const isBottomLeft = x === 0 && y === gridSize - 1;
    const isBottomRight = x === gridSize - 1 && y === gridSize - 1;

    return (
      <div
        key={`${x}-${y}`}
        className={clsx(
          "w-full h-full inline-block",
          isTopLeft && "rounded-tl-[0.5rem]",
          isTopRight && "rounded-tr-[0.5rem]",
          isBottomLeft && "rounded-bl-[0.5rem]",
          isBottomRight && "rounded-br-[0.5rem]",
          showGrid && "border border-gray-700",
          {
            "bg-green-500": isSnake,
            "bg-red-500 rounded-full": isFood,
            "bg-gray-800": !isSnake && !isFood
          }
        )}
      />
    );
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push(renderCell(x, y));
      }
    }
    return grid;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 overscroll-none touch-none">
      <div className="mb-6 text-3xl md:text-4xl font-bold">Snake Game</div>
      <div className="mb-4 flex items-center justify-between w-full max-w-[540px]">
        <div className="text-xl md:text-2xl font-semibold">Score: {score}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className={clsx(
              "px-4 py-2 text-white text-sm rounded-lg transition-colors shadow-md",
              "bg-purple-500 hover:bg-purple-600"
            )}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={clsx(
              "px-4 py-2 text-white text-sm rounded-lg transition-colors shadow-md",
              "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </button>
        </div>
      </div>
      <div className="w-full max-w-[95vw] md:max-w-[540px] aspect-square relative">
        <div className="grid grid-cols-20 gap-0 bg-gray-800 border-2 border-gray-700 rounded-[0.75rem] overflow-hidden shadow-lg w-full h-full">
          {renderGrid()}
        </div>
        {isPaused && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-3xl md:text-4xl font-bold text-white">PAUSED</p>
          </div>
        )}
      </div>
      {gameOver && (
        <div className="mt-6 text-center">
          <p className="text-2xl md:text-3xl font-bold text-red-500 mb-4">
            Game Over!
          </p>
          <button
            onClick={resetGame}
            className={clsx(
              "px-6 py-3 text-white text-lg rounded-lg transition-colors shadow-md",
              "bg-green-500 hover:bg-green-600"
            )}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
