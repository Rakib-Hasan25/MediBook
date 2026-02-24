const OpenAI = require("openai");

function parseAIResult(rawContent) {
  try {
    const parsed = JSON.parse(rawContent || "{}");
    return {
      verified: Boolean(parsed.verified),
      reason: parsed.reason || "AI review completed.",
    };
  } catch (error) {
    return {
      verified: false,
      reason: "AI response could not be parsed.",
    };
  }
}

async function verifyDoctorWithAI({license_number, specialization, document_url}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const openai = new OpenAI({apiKey});
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {type: "json_object"},
    messages: [
      {
        role: "system",
        content:
          "You are a very lenient validator for test environments. " +
          "Accept most submissions and reject only when details are obviously nonsense or unrelated. " +
          "If uncertain, mark as verified. " +
          "Always return strict JSON: {\"verified\": boolean, \"reason\": string}.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Doctor verification request:\n` +
              `license_number: ${license_number}\n` +
              `specialization: ${specialization}\n` +
              "Do a minimal check only. Reject only if clearly invalid.",
          },
          {
            type: "image_url",
            image_url: {url: document_url},
          },
        ],
      },
    ],
  });

  const rawContent = completion.choices?.[0]?.message?.content;
  return parseAIResult(rawContent);
}

module.exports = {
  verifyDoctorWithAI,
};
