import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

type Theme = "light" | "dark";

const getSystemTheme = (): Theme => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

const getStoredTheme = (): Theme => {
  const storedTheme = localStorage.getItem("theme") as Theme;
  return storedTheme || getSystemTheme();
};

type Position = {
  x: number;
  y: number;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export default function SnakeGame() {
  const gridSize = 20;
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showGrid, setShowGrid] = useState(() => {
    const storedGridVisibility = localStorage.getItem("showGrid");
    return storedGridVisibility === "true";
  });
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<Position | null>(null);
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest("button")) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest("button")) {
        e.preventDefault();
      }
      if (!touchStart || gameOver || isPaused) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const minSwipeDistance = 30;

      if (
        Math.abs(deltaX) < minSwipeDistance &&
        Math.abs(deltaY) < minSwipeDistance
      )
        return;

      let newDirection: Direction | null = null;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && (direction !== "LEFT" || !isGameStarted)) newDirection = "RIGHT";
        else if (deltaX < 0 && (direction !== "RIGHT" || !isGameStarted)) newDirection = "LEFT";
      } else {
        if (deltaY > 0 && (direction !== "UP" || !isGameStarted)) newDirection = "DOWN";
        else if (deltaY < 0 && (direction !== "DOWN" || !isGameStarted)) newDirection = "UP";
      }

      if (newDirection) {
        setDirection(newDirection);
        if (!isGameStarted) {
          setIsGameStarted(true);
        }
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
    if (gameOver || isPaused || !isGameStarted || !direction) return;

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
          .slice(3)
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
          if (!isGameStarted || direction !== "DOWN") newDirection = "UP";
          break;
        case "ArrowDown":
          if (!isGameStarted || direction !== "UP") newDirection = "DOWN";
          break;
        case "ArrowLeft":
          if (!isGameStarted || direction !== "RIGHT") newDirection = "LEFT";
          break;
        case "ArrowRight":
          if (!isGameStarted || direction !== "LEFT") newDirection = "RIGHT";
          break;
      }

      if (newDirection) {
        setDirection(newDirection);
        if (!isGameStarted) {
          setIsGameStarted(true);
        }
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
    setDirection(null);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setIsGameStarted(false);
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
          "w-full h-full inline-block relative",
          isTopLeft && "rounded-tl-[0.5rem]",
          isTopRight && "rounded-tr-[0.5rem]",
          isBottomLeft && "rounded-bl-[0.5rem]",
          isBottomRight && "rounded-br-[0.5rem]",
          showGrid && theme === "dark"
            ? "border border-gray-700"
            : showGrid
            ? "border border-gray-700"
            : "",
          {
            "bg-green-500": isSnake,
            [theme === "dark" ? "bg-gray-800" : "bg-gray-300"]: !isSnake,
          }
        )}
      >
        {isFood && <div className="absolute inset-0 bg-red-500 rounded-full" />}
      </div>
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
    <div
      className={clsx(
        "flex flex-col items-center min-h-screen p-4 overscroll-none touch-none transition-colors",
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-900"
      )}
    >
      <div className="mb-6 text-3xl md:text-4xl font-bold">Snake Game</div>
      {!isGameStarted && !gameOver && (
        <div className="mb-4 text-xl text-center">
          Press an arrow key to start the game
        </div>
      )}
      <div className="mb-4 flex items-center justify-between w-full max-w-[540px]">
        <div className="text-xl md:text-2xl font-semibold">Score: {score}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className={clsx(
              "px-4 py-2 text-white text-sm rounded-lg transition-colors shadow-md",
              "bg-purple-500 hover:bg-purple-600"
            )}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => {
              const newShowGrid = !showGrid;
              setShowGrid(newShowGrid);
              localStorage.setItem("showGrid", newShowGrid.toString());
            }}
            className={clsx(
              "px-4 py-2 text-white text-sm rounded-lg transition-colors shadow-md",
              "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={clsx(
              "px-4 py-2 text-sm rounded-lg transition-colors shadow-md",
              theme === "dark"
                ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            )}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
      <div className="w-full max-w-[95vw] md:max-w-[540px] aspect-square relative">
        <div
          className={clsx(
            "grid grid-cols-20 gap-0 border-2 rounded-[10px] overflow-hidden shadow-lg w-full h-full transition-colors bg-gray-700 border-gray-700"
          )}
        >
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
