import TypingAnimation from './components/TypingAnimation';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-900">
      <div className="font-alphaLyrae text-center">
        <h1 className="font-extrabold text-emerald-50 text-6xl">Qwen Code Interpreter</h1>
        <p className="text-emerald-200 text-2xl mt-4">
          <TypingAnimation text="Qwen-2.5-Coder with access to an in-browser code interpreter." />
        </p>
      </div>
    </div>
  );
}
