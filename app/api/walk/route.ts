interface WalkStop {
  name: string;
  backstory: string;
  safetyNote: string;
}

interface Walk {
  title: string;
  stops: WalkStop[];
}

function isWalk(value: unknown): value is Walk {
  if (typeof value !== "object" || value === null || !("title" in value) || !("stops" in value)) {
    return false;
  }

  const walk = value as { title: unknown; stops: unknown };
  return (
    typeof walk.title === "string" &&
    Array.isArray(walk.stops) &&
    walk.stops.length === 5 &&
    walk.stops.every(
      (stop) =>
        typeof stop === "object" &&
        stop !== null &&
        "name" in stop &&
        "backstory" in stop &&
        "safetyNote" in stop &&
        typeof stop.name === "string" &&
        typeof stop.backstory === "string" &&
        typeof stop.safetyNote === "string",
    )
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "The Gemini API key is not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("place" in body) ||
    typeof body.place !== "string" ||
    !body.place.trim()
  ) {
    return Response.json({ error: "Place must be a non-empty string." }, { status: 400 });
  }

  const place = body.place.trim();
  const prompt = `SYSTEM-STYLE INSTRUCTION: All stories must be invented and clearly fictional. Never claim that real people were harmed or that real locations are truly haunted.

Create a fictional haunted walk for this place: ${place}

Return ONLY valid JSON, with no extra text, using exactly this shape:
{
  "title": "A short walk title",
  "stops": [
    {
      "name": "A stop name",
      "backstory": "An invented, clearly fictional backstory told in 2 to 3 sentences.",
      "safetyNote": "Remind visitors to stay on public paths and visit in daylight or at dusk."
    }
  ]
}

Include exactly 5 stop objects. Every stop must have a 2 to 3 sentence fictional backstory and a safetyNote that reminds visitors to stay on public paths and visit in daylight or dusk.`;
  const endpoint = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
  );
  endpoint.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    console.error(
      "Gemini fetch error:",
      err instanceof Error ? err.name : "UnknownError",
      err instanceof Error ? err.message : String(err),
    );
    return Response.json({ error: "Could not reach the Gemini API." }, { status: 502 });
  }

  if (!response.ok) {
    const responseBody = await response.text();
    console.error("Gemini API request failed:", {
      status: response.status,
      body: responseBody,
    });
    return Response.json({ error: "The Gemini API request failed." }, { status: 502 });
  }

  let responseBody = "";
  let generatedText: unknown;
  try {
    responseBody = await response.text();
    const data: unknown = JSON.parse(responseBody);
    if (
      typeof data === "object" &&
      data !== null &&
      "candidates" in data &&
      Array.isArray(data.candidates)
    ) {
      const firstCandidate: unknown = data.candidates[0];
      if (
        typeof firstCandidate === "object" &&
        firstCandidate !== null &&
        "content" in firstCandidate &&
        typeof firstCandidate.content === "object" &&
        firstCandidate.content !== null &&
        "parts" in firstCandidate.content &&
        Array.isArray(firstCandidate.content.parts)
      ) {
        const firstPart: unknown = firstCandidate.content.parts[0];
        if (typeof firstPart === "object" && firstPart !== null && "text" in firstPart) {
          generatedText = firstPart.text;
        }
      }
    }
  } catch {
    console.error("Gemini returned an invalid response:", {
      status: response.status,
      body: responseBody,
    });
    return Response.json({ error: "The Gemini API returned an invalid response." }, { status: 502 });
  }

  if (typeof generatedText !== "string") {
    return Response.json({ error: "The Gemini API returned no walk." }, { status: 502 });
  }

  const jsonText = generatedText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let walk: unknown;
  try {
    walk = JSON.parse(jsonText);
  } catch {
    console.error("Gemini returned invalid walk JSON:", {
      status: response.status,
      body: responseBody,
    });
    return Response.json({ error: "The Gemini response was not valid JSON." }, { status: 502 });
  }

  if (!isWalk(walk)) {
    return Response.json({ error: "The Gemini response did not contain a valid walk." }, { status: 502 });
  }

  return Response.json(walk);
}
