"use client";
import { useEffect, useRef, useState } from "react";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"playing" | "caught">("playing");
  const caughtTimeRef = useRef<number>(0);

  // --- Messages ---
  const messages = [
    "Quack! 🐥",
    "Can't catch me!",
    "Need more breadcrumbs!",
    "Too slow, froggy!",
    "Zoom zoom!",
  ];
  const currentMessageRef = useRef("");
  const messageTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const duckImg = new Image();
    duckImg.src = "/duck.png";
    const frogImg = new Image();
    frogImg.src = "/frog.png";

    const duck = { x: 200, y: 150, speed: 3 };
    const target = { x: duck.x, y: duck.y };
    const frog = { x: 50, y: 50, speed: 2 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Controller
    function setTarget(e: MouseEvent) {
      if (gameState !== "playing") return;
      const rect = canvas.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
    }
    canvas.addEventListener("click", setTarget);

    // Show random message every 2–4 seconds
    let nextMessageAt = Date.now() + 2000;
    function maybeShowMessage() {
      if (gameState !== "playing") return;
      const now = Date.now();
      if (now >= nextMessageAt) {
        currentMessageRef.current =
          messages[Math.floor(Math.random() * messages.length)];
        messageTimeRef.current = now;
        nextMessageAt = now + 2000 + Math.random() * 2000;
      }
    }

    function update() {
      if (gameState !== "playing") return;

      // Maybe show bubble
      maybeShowMessage();

      // Duck movement
      const dx = target.x - duck.x;
      const dy = target.y - duck.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        duck.x += (dx / dist) * duck.speed;
        duck.y += (dy / dist) * duck.speed;
      }

      duck.x = Math.max(0, Math.min(canvas.width - 32, duck.x));
      duck.y = Math.max(0, Math.min(canvas.height - 32, duck.y));

      // Frog chases duck
      const fx = duck.x - frog.x;
      const fy = duck.y - frog.y;
      const fDist = Math.hypot(fx, fy);
      frog.x += (fx / fDist) * frog.speed;
      frog.y += (fy / fDist) * frog.speed;

      // Collision
      if (fDist < 20 && gameState === "playing") {
        setGameState("caught");
        caughtTimeRef.current = Date.now();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(duckImg, duck.x, duck.y, 32, 32);
      ctx.drawImage(frogImg, frog.x, frog.y, 32, 32);

      // Speech bubble (visible for 1.5s)
      const showTime = 1500;
      if (
        gameState === "playing" &&
        Date.now() - messageTimeRef.current < showTime &&
        currentMessageRef.current
      ) {
        const text = currentMessageRef.current;
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;

        const bubbleX = duck.x + 16;
        const bubbleY = duck.y - 10;

        // Background
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bubbleX - textWidth / 2 - 6, bubbleY - 20, textWidth + 12, 22);

        // Text
        ctx.fillStyle = "white";
        ctx.fillText(text, bubbleX, bubbleY - 5);
      }

      // “Caught” animation
      if (gameState === "caught") {
        const t = Math.min(
          1,
          (Date.now() - caughtTimeRef.current) / 500
        );
        ctx.fillStyle = `rgba(255,0,0,${1 - t})`;
        ctx.beginPath();
        ctx.arc(duck.x + 16, duck.y + 16, 40 * t, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Caught!", duck.x + 16, duck.y - 20);
      }
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    duckImg.onload = frogImg.onload = loop;
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("click", setTarget);
    };
  }, [gameState]);

  function resetGame() {
    window.location.reload();
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-screen h-screen"
      />
      {gameState === "caught" && (
        <button
          onClick={resetGame}
          className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow"
        >
          Reset
        </button>
      )}
    </div>
  );
}
