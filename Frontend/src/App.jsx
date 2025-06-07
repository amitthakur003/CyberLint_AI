import { useState, useEffect, useRef } from "react";
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";
import {
  Clipboard,
  Code2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

// Default supported languages
const SUPPORTED_LANGUAGES = {
  javascript: { name: "JavaScript", prism: "javascript" },
  typescript: { name: "TypeScript", prism: "typescript" },
  python: { name: "Python", prism: "python" },
  java: { name: "Java", prism: "java" },
  cpp: { name: "C++", prism: "cpp" },
};

function App() {
  const [code, setCode] = useState(`function sum(a, b) {
  // Add proper type checking and error handling
  return a + b;
}`);
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [filename, setFilename] = useState("50+ Languages Supported");
  const reviewRef = useRef(null);

  // Auto-highlight code when language or review changes
  useEffect(() => {
    prism.highlightAll();
  }, [selectedLanguage, review]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  async function reviewCode() {
    if (!code.trim()) {
      setError("Please enter some code to review");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post("http://localhost:3000/ai/get-review", {
        code,
        language: selectedLanguage,
        filename,
      });

      setReview(response.data);

      // Scroll to review after it loads
      setTimeout(() => {
        reviewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to get review. The server might be down or your code is too complex."
      );
      console.error("Review error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function copyImprovedCode() {
    if (!review) return;

    // Extract the last code block from markdown (most likely the fixed version)
    const codeBlocks = review.match(/```[\s\S]*?```/g);
    if (codeBlocks && codeBlocks.length > 0) {
      const cleanedCode = codeBlocks[codeBlocks.length - 1]
        .replace(/```[a-z]*\n/, "")
        .replace(/\n```/, "");
      navigator.clipboard.writeText(cleanedCode);
      setCopied(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Code2 className="mr-2 h-5 w-5 text-indigo-600" />
              AI Code Inspector
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Expert-level code analysis in seconds
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Language selector removed as per requirements */}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Code Editor Section */}
          <div className="flex-1 flex flex-col min-h-[70vh]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
              <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="ml-2 text-sm font-medium text-gray-700 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {code.split("\n").length} lines | {code.length} chars
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  value={code}
                  onValueChange={setCode}
                  highlight={(code) =>
                    prism.highlight(
                      code,
                      prism.languages[
                        SUPPORTED_LANGUAGES[selectedLanguage].prism
                      ],
                      SUPPORTED_LANGUAGES[selectedLanguage].prism
                    )
                  }
                  padding={16}
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: 14,
                    backgroundColor: "#fafafa",
                    color: "#333",
                    height: "100%",
                    width: "100%",
                    overflow: "auto",
                    lineHeight: "1.5",
                  }}
                  textareaClassName="focus:outline-none"
                />
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setCopied(true);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <Clipboard className="mr-1 h-4 w-4" />
                  {copied ? "Copied!" : "Copy Code"}
                </button>
                <button
                  onClick={reviewCode}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    isLoading
                      ? "bg-indigo-400 text-white cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } transition-colors flex items-center`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CircleDot className="mr-2 h-4 w-4" />
                      Analyze Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Review Section */}
          <div className="flex-1 flex flex-col min-h-[70vh]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
              <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="text-sm font-medium text-gray-700 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-indigo-600" />
                  Code Analysis
                </h2>
                {review && (
                  <button
                    onClick={copyImprovedCode}
                    disabled={!review || copied}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <Clipboard className="mr-1 h-4 w-4" />
                    {copied ? "Copied!" : "Copy Improved Code"}
                  </button>
                )}
              </div>
              <div
                ref={reviewRef}
                className="flex-1 overflow-auto p-4 prose prose-sm max-w-none"
                style={{ scrollBehavior: "smooth" }}
              >
                {error ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Analysis Failed
                        </h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ) : review ? (
                  <>
                    <Markdown rehypePlugins={[rehypeHighlight]}>
                      {review}
                    </Markdown>
                    <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                      <p>
                        Analyzed as {SUPPORTED_LANGUAGES[selectedLanguage].name}{" "}
                        code
                      </p>
                      <p className="mt-1">
                        Review completed at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center max-w-xs">
                      <Code2 className="mx-auto h-8 w-8 mb-3 opacity-60" />
                      <h3 className="text-sm font-medium text-gray-500">
                        Ready for Analysis
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">
                        Write or paste your code and click "Analyze Code" to get
                        expert feedback.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500">
            AI Code Inspector © {new Date().getFullYear()} - For educational
            purposes only
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
