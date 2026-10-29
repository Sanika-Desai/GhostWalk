"use client";

import { useState, type FormEvent } from "react";

interface WalkStop {
  name: string;
  backstory: string;
  safetyNote: string;
}

interface WalkResult {
  title: string;
  stops: WalkStop[];
}

function isWalkResult(value: unknown): value is WalkResult {
  if (
    typeof value !== "object" ||
    value === null ||
    !("title" in value) ||
    typeof value.title !== "string" ||
    !("stops" in value) ||
    !Array.isArray(value.stops)
  ) {
    return false;
  }

  return value.stops.every(
    (stop) =>
      typeof stop === "object" &&
      stop !== null &&
      "name" in stop &&
      typeof stop.name === "string" &&
      "backstory" in stop &&
      typeof stop.backstory === "string" &&
      "safetyNote" in stop &&
      typeof stop.safetyNote === "string",
  );
}

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return "Something went wrong. Please try again.";
}

export default function Home() {
  const [place, setPlace] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walk, setWalk] = useState<WalkResult | null>(null);
  const [error, setError] = useState("");

  async function conjureWalk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submittedPlace = place.trim();
    if (!submittedPlace) {
      setError("Please enter a place first.");
      return;
    }

    setIsLoading(true);
    setWalk(null);
    setError("");

    try {
      const response = await fetch("/api/walk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: submittedPlace }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(data));
      } else if (isWalkResult(data)) {
        setWalk(data);
      } else {
        setError("The server returned an invalid walk. Please try again.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-100">
      <section className="w-full max-w-xl rounded-3xl border border-violet-900/50 bg-zinc-900/80 p-8 shadow-2xl shadow-violet-950/30 sm:p-12">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
          A path through the unknown
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-violet-100 sm:text-5xl">
          Ghost Walk
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-300">
          Type a place you know and we&apos;ll conjure a haunted walk.
        </p>

        <form className="mt-8 space-y-4" onSubmit={conjureWalk}>
          <label
            className="block text-sm font-medium text-zinc-200"
            htmlFor="place"
          >
            Town, campus, or park
          </label>
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            id="place"
            name="place"
            onChange={(event) => {
              setPlace(event.target.value);
              setWalk(null);
              setError("");
            }}
            placeholder="e.g. Salem, your campus, or a favorite park"
            required
            type="text"
            value={place}
          />
          <button
            className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Conjuring..." : "Conjure my walk"}
          </button>
          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {walk && (
            <section aria-label="Your haunted walk" className="mt-8 space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-violet-100">
                  {walk.title}
                </h2>
                <p className="mt-2 text-sm text-emerald-300">
                  Stay on public paths and walk in daylight or dusk.
                </p>
              </div>
              <ol className="space-y-4">
                {walk.stops.map((stop, index) => (
                  <li
                    className="rounded-2xl border border-violet-900/50 bg-zinc-950/70 p-5"
                    key={`${index}-${stop.name}`}
                  >
                    <article>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                        Stop {index + 1}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-violet-100">
                        {stop.name}
                      </h3>
                      <p className="mt-2 leading-7 text-zinc-300">
                        {stop.backstory}
                      </p>
                      <p className="mt-3 text-sm text-emerald-200">
                        {stop.safetyNote}
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </form>
      </section>
    </main>
  );
}
