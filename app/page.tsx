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
  const [exploredStops, setExploredStops] = useState<number[]>([]);
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
    setExploredStops([]);
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

  function toggleExplored(index: number) {
    setExploredStops((currentStops) =>
      currentStops.includes(index)
        ? currentStops.filter((stopIndex) => stopIndex !== index)
        : [...currentStops, index],
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09080f] px-5 py-12 text-zinc-100 sm:px-8 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-950/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-96 h-96 w-96 rounded-full bg-emerald-950/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-3xl border border-violet-900/50 bg-zinc-900/80 p-7 shadow-2xl shadow-violet-950/30 sm:p-10">
          <div className="absolute right-8 top-8 hidden items-center gap-5 sm:flex" aria-hidden="true">
            <svg className="h-12 w-12 text-amber-100/80" viewBox="0 0 48 48" fill="none">
              <path
                d="M37.5 31.5A18 18 0 0 1 16.5 10.5 18 18 0 1 0 37.5 31.5Z"
                fill="currentColor"
              />
              <path d="m8 7 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="#6ee7b7" />
              <circle cx="10" cy="24" r="1.5" fill="#c4b5fd" />
            </svg>
            <svg className="h-14 w-14 text-violet-200/80" viewBox="0 0 64 64" fill="none">
              <path
                d="M16 53V28a16 16 0 1 1 32 0v25l-8-5-8 5-8-5-8 5Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="29" r="2" fill="#6ee7b7" />
              <circle cx="38" cy="29" r="2" fill="#6ee7b7" />
              <path d="M29 37c2 2 4 2 6 0" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            A path through the unknown
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-violet-100 sm:text-5xl">
            Ghost Walk
          </h1>
          <p className="mt-3 max-w-lg text-base leading-7 text-zinc-300 sm:text-lg">
            Type a place you know and we&apos;ll conjure a haunted walk.
          </p>

          <form className="mt-7 flex flex-col gap-3 sm:flex-row" onSubmit={conjureWalk}>
            <label className="sr-only" htmlFor="place">
              Town, campus, or park
            </label>
            <input
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              id="place"
              name="place"
              onChange={(event) => {
                setPlace(event.target.value);
                setWalk(null);
                setExploredStops([]);
                setError("");
              }}
              placeholder="Town, campus, or park"
              required
              type="text"
              value={place}
            />
            <button
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-wait disabled:opacity-70"
              disabled={isLoading}
              type="submit"
            >
              {isLoading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950"
                />
              )}
              {isLoading ? "Conjuring..." : "Conjure my walk"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {isLoading && (
            <p className="mt-4 text-sm text-violet-200" role="status">
              Gathering the stories from the mist...
            </p>
          )}
        </section>

        {walk && (
          <section aria-label="Your haunted walk" className="mt-10">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-300">
                  Your destination
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-violet-100 sm:text-4xl">
                  {place.trim()}
                </h2>
                <p className="mt-2 text-zinc-400">{walk.title}</p>
              </div>
              <div className="w-full sm:w-56">
                <p className="mb-2 text-sm text-zinc-300">
                  {exploredStops.length} of {walk.stops.length} stops explored
                </p>
                <div
                  aria-label={`${exploredStops.length} of ${walk.stops.length} stops explored`}
                  className="h-2 overflow-hidden rounded-full bg-zinc-800"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={walk.stops.length}
                  aria-valuenow={exploredStops.length}
                >
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${(exploredStops.length / walk.stops.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {walk.stops.map((stop, index) => {
                const isExplored = exploredStops.includes(index);

                return (
                  <li
                    className={`rounded-2xl border bg-zinc-900/80 p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-violet-950/30 sm:p-6 ${
                      isExplored
                        ? "border-emerald-700/70"
                        : "border-violet-900/50 hover:border-violet-700/70"
                    } ${index === 4 ? "md:col-span-2" : ""}`}
                    key={`${index}-${stop.name}`}
                  >
                    <article className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-700/60 bg-violet-950/60 font-mono text-sm text-emerald-200">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
                              Stop {index + 1}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-violet-100">
                              {stop.name}
                            </h3>
                          </div>
                        </div>
                        <button
                          aria-pressed={isExplored}
                          className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                          onClick={() => toggleExplored(index)}
                          type="button"
                        >
                          {isExplored ? "✓ Explored" : "Mark explored"}
                        </button>
                      </div>

                      <p className="mt-5 leading-7 text-zinc-300">{stop.backstory}</p>

                      <div className="mt-5 rounded-xl border border-violet-900/50 bg-zinc-950/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                          Walking note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {stop.safetyNote}
                        </p>
                      </div>

                      <p className="mt-auto pt-5 text-xs leading-5 text-emerald-300/90">
                        Stay on public paths and walk in daylight or at dusk.
                      </p>
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
