import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse the incoming request
    const { code, language, input } = await request.json();

    // Validate required parameters
    if (!code || !language) {
      return NextResponse.json(
        {
          error: "Missing required parameters: code and language are required",
        },
        { status: 400 }
      );
    }

    // Properly escape and format the code prompt
    const prompt = {
      contents: [
        {
          parts: [
            {
              text: `You are an advanced code execution engine capable of running code in various programming languages. Execute the following code based on the provided input and return the output or any errors.

Languages:
py for python
java for java
js for javascript
php for php
cpp for cpp and c
ts for TypeScript



Execution Rules:

Run the code in a secure, sandboxed environment.
If the code requires user input, simulate it using the provided input.
Capture and return the standard output or any error messages.
If the code contains syntax or runtime errors, return detailed error information.
Expected Output Format:

standard output or error message or null

Example Execution:
Input JSON:

{
  "code": "num = int(input(\"Enter the number: \"))\npint(num)",
  "input": "25",
  "language": "py"
}
Expected Output:

<output or error if any>

Now, execute the following code:

Language: ${language}
Input: ${input || "None"}
Code:
${code}`,
            },
          ],
        },
      ],
    };

    // Make the API request to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prompt),
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${errorData}`);
    }

    // Parse the response
    const data = await response.json();

    // Check if we have a valid response from Gemini
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Extract the text from the response
    const outputText = data.candidates[0].content.parts[0].text;
    const trimmedOutput = outputText.replace(/^```text\s*|\s*```$/g, "").trim();
    console.log(trimmedOutput);

    // Try to parse the output as JSON
    try {
      const parsedOutput = JSON.parse(trimmedOutput);
      return NextResponse.json(trimmedOutput);
    } catch (parseError) {
      // If parsing fails, return the raw text
      return NextResponse.json({
        output: trimmedOutput,
        error: null,
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Code execution failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
