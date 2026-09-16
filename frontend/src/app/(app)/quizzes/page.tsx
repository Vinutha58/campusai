"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMyCourses } from "@/hooks/useMyCourses";
import { CourseSelect, NoCourses } from "@/components/faculty/CourseSelect";
import {
  ApiError,
  attemptQuiz,
  createQuiz,
  getEnrolledCourses,
  getMyAttempt,
  getQuizResults,
  getQuizzes,
  type Course,
  type Quiz,
  type QuizAttemptResult,
  type QuizForStudent,
  type QuizQuestion,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Plus, Trash } from "lucide-react";

const EMPTY_QUESTION: QuizQuestion = { question: "", options: ["", ""], correct_index: 0 };

function FacultyQuizzes() {
  const { courses, selectedId, setSelectedId, isLoading } = useMyCourses();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizAttemptResult[]>([]);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ ...EMPTY_QUESTION }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getQuizzes(selectedId).then((data) => setQuizzes(data as Quiz[]));
  }, [selectedId]);

  useEffect(() => {
    if (!activeQuiz) return;
    getQuizResults(activeQuiz.id).then(setResults);
  }, [activeQuiz]);

  const handleCourseChange = (id: string) => {
    setSelectedId(id);
    setActiveQuiz(null);
  };

  const handleSelectQuiz = (q: Quiz) => {
    setActiveQuiz(q);
    setResults([]);
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
      )
    );
  };

  const handleCreate = async () => {
    if (!selectedId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createQuiz({ course_id: selectedId, title, questions });
      setTitle("");
      setQuestions([{ ...EMPTY_QUESTION }]);
      setQuizzes((await getQuizzes(selectedId)) as Quiz[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && courses.length === 0) return <NoCourses />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={handleCourseChange} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Quizzes" />
            <ul className="space-y-2">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <button
                    onClick={() => handleSelectQuiz(q)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      activeQuiz?.id === q.id
                        ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5"
                        : "border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{q.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{q.questions.length} question(s)</p>
                  </button>
                </li>
              ))}
              {quizzes.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No quizzes yet.</p>}
            </ul>
          </Card>

          {activeQuiz && (
            <Card>
              <CardHeader title={`Results — ${activeQuiz.title}`} />
              <ul className="space-y-2">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{r.student_name}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {r.score}/{r.total}
                    </span>
                  </li>
                ))}
                {results.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No attempts yet.</p>
                )}
              </ul>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="New Quiz" />
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Question ${qIndex + 1}`}
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  {questions.length > 1 && (
                    <button
                      onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correct_index === oIndex}
                        onChange={() => updateQuestion(qIndex, { correct_index: oIndex })}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button
                      onClick={() =>
                        updateQuestion(qIndex, { options: [...q.options, ""] })
                      }
                      className="self-start text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => setQuestions((qs) => [...qs, { ...EMPTY_QUESTION, options: ["", ""] }])}
              className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              <Plus size={14} /> Add question
            </button>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !title}
              className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create quiz"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StudentQuizzes() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizForStudent[]>([]);

  useEffect(() => {
    getEnrolledCourses().then((data) => {
      setCourses(data);
      setSelectedId(data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getQuizzes(selectedId).then((data) => setQuizzes(data as QuizForStudent[]));
  }, [selectedId]);

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">You&apos;re not enrolled in any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Course:</span>
        <CourseSelect courses={courses} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      <div className="flex flex-col gap-4">
        {quizzes.map((q) => (
          <StudentQuizCard key={q.id} quiz={q} />
        ))}
        {quizzes.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No quizzes yet for this course.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function StudentQuizCard({ quiz }: { quiz: QuizForStudent }) {
  const [attempt, setAttempt] = useState<QuizAttemptResult | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(quiz.questions.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMyAttempt(quiz.id).then(setAttempt);
  }, [quiz.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      setAttempt(await attemptQuiz(quiz.id, answers));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader title={quiz.title} subtitle={`${quiz.questions.length} question(s)`} />
      {attempt ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          You scored {attempt.score}/{attempt.total}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {quiz.questions.map((q, qIndex) => (
            <div key={qIndex}>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{q.question}</p>
              <div className="mt-1.5 flex flex-col gap-1">
                {q.options.map((opt, oIndex) => (
                  <label key={oIndex} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() =>
                        setAnswers((a) => a.map((v, i) => (i === qIndex ? oIndex : v)))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answers.includes(-1)}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit answers"}
          </button>
        </div>
      )}
    </Card>
  );
}

export default function QuizzesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "faculty") return <FacultyQuizzes />;
  if (user.role === "student") return <StudentQuizzes />;
  return <ComingSoon title="Quizzes" />;
}
