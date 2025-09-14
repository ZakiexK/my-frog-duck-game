"use client";
import { useEffect, useRef, useState } from "react";

export default function FrogDuckGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"playing" | "caught">("playing");
  const caughtTimeRef = useRef(0);

  // Messages
  const duckMsgs = [
    "Quack! 🐥",
    "Can't catch me!",
    "Need breadcrumbs!",
    "Too slow, froggy!",
    "Zoom zoom!",
  ];
  const frogMsgs = [
    "Ribbit! 💚",
    "Wait for me, ducky!",
    "Hop hop hop!",
    "You’re quacktastic!",
    "Best friends forever!",
  ];

  const duckMsgRef = useRef("");
  const duckMsgTimeRef = useRef(0);
  const frogMsgRef = useRef("");
  const frogMsgTimeRef = useRef(0);

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
    const frog = { x: 50, y: 50, speed: 2.2 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Controller (click + touch)
    function setTarget(x: number, y: number) {
      if (gameState !== "playing") return;
      target.x = x;
      target.y = y;
    }
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setTarget(e.clientX - rect.left, e.clientY - rect.top);
    };
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      setTarget(t.clientX - rect.left, t.clientY - rect.top);
    };
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouch);

    // Message timers
    let nextDuckMsgAt = Date.now() + 2000;
    let nextFrogMsgAt = Date.now() + 3000;

    function maybeShowMessages() {
      if (gameState !== "playing") return;
      const now = Date.now();
      if (now >= nextDuckMsgAt) {
        duckMsgRef.current =
          duckMsgs[Math.floor(Math.random() * duckMsgs.length)];
        duckMsgTimeRef.current = now;
        nextDuckMsgAt = now + 2000 + Math.random() * 2000;
      }
      if (now >= nextFrogMsgAt) {
        frogMsgRef.current =
          frogMsgs[Math.floor(Math.random() * frogMsgs.length)];
        frogMsgTimeRef.current = now;
        nextFrogMsgAt = now + 2500 + Math.random() * 3000;
      }
    }

    function update() {
      if (gameState !== "playing") return;

      maybeShowMessages();

      // Duck → target
      const dx = target.x - duck.x;
      const dy = target.y - duck.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        duck.x += (dx / dist) * duck.speed;
        duck.y += (dy / dist) * duck.speed;
      }

      // Keep inside screen
      duck.x = Math.max(0, Math.min(canvas.width - 32, duck.x));
      duck.y = Math.max(0, Math.min(canvas.height - 32, duck.y));

      // Frog → duck
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
    // Speech bubble
    function drawBubble(
      text: string,
      x: number,
      y: number,
      bg: string,
      visibleMs: number,
      startTime: number
    ) {
      if (!text || Date.now() - startTime > visibleMs) return;
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      const textW = ctx.measureText(text).width;
      const padding = 6;
      ctx.fillStyle = bg;
      ctx.fillRect(x - textW / 2 - padding, y - 24, textW + padding * 2, 22);
      ctx.fillStyle = "white";
      ctx.fillText(text, x, y - 8);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(duckImg, duck.x, duck.y, 32, 32);
      ctx.drawImage(frogImg, frog.x, frog.y, 32, 32);

      // Speech bubbles
      drawBubble(
        duckMsgRef.current,
        duck.x + 16,
        duck.y - 5,
        "rgba(0,0,0,0.7)",
        1500,
        duckMsgTimeRef.current
      );
      drawBubble(
        frogMsgRef.current,
        frog.x + 16,
        frog.y - 5,
        "rgba(34,197,94,0.8)",
        1500,
        frogMsgTimeRef.current
      );

      // Caught animation
      if (gameState === "caught") {
        const t = Math.min(1, (Date.now() - caughtTimeRef.current) / 500);
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
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouch);
    };
  }, [gameState]);

  function resetGame() {
    window.location.reload(); // simplest for now
  }

  return (
    <div className="relative w-screen h-screen">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-screen h-screen touch-none"
      />
      {gameState === "caught" && (
        <button
          onClick={resetGame}
          className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg"
        >
          Reset
        </button>
      )}
    </div>
  );
}
