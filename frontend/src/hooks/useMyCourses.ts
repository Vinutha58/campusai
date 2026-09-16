"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyCourses, type Course } from "@/lib/api";

export function useMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return getMyCourses()
      .then((data) => {
        setCourses(data);
        setSelectedId((current) =>
          current && data.some((c) => c.id === current) ? current : (data[0]?.id ?? null)
        );
        setError(null);
        return data;
      })
      .catch(() => setError("Couldn't load your courses."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedCourse = courses.find((c) => c.id === selectedId) ?? null;

  return { courses, selectedId, setSelectedId, selectedCourse, isLoading, error, refresh };
}
