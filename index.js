require('dotenv').config();
const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function transcribeAudio(inputPath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(inputPath),
      model: 'whisper-1',
    });

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-mm-ss

    // Save raw transcription with timestamp
    const transcriptionPath = path.join(outputDir, `transcription_${timestamp}.txt`);
    fs.writeFileSync(transcriptionPath, transcription.text);
    console.log('Transcription saved to:', transcriptionPath);

    return transcription.text;
  } catch (error) {
    console.error('Error in transcription:', error);
    throw error;
  }
}

async function generateFlashcardFromText(text) {
  try {
    const promptTemplate = fs.readFileSync(path.join(__dirname, 'flashcard-prompt.txt'), 'utf8');
    
    const flashcardResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptTemplate
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }  // Add structured output
    });

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-mm-ss

    // Save summary with timestamp
    const flashcardPath = path.join(outputDir, `flashcard_${timestamp}.txt`);
    fs.writeFileSync(flashcardPath, flashcardResponse.choices[0].message.content);
    console.log('Flashcard saved to:', flashcardPath);

    return flashcardResponse.choices[0].message.content;
  } catch (error) {
    console.error('Error in flashcard generation:', error);
    throw error;
  }
}

async function generateFlashcards(transcriptionText) {
  try {
    console.log('Starting flashcard generation...');
    const flashcards = await generateFlashcardFromText(transcriptionText);
    console.log('Flashcard generation completed successfully!');
    return flashcards;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}

// =============================================
// STEP 1: Generate Transcript
// =============================================
// const inputFile = path.join(__dirname, 'media', 'test.m4a');
// generateTranscript(inputFile)
//   .then(transcript => {
//     console.log('Transcript generated successfully');
//   })
//   .catch(error => console.error('Transcription error:', error));

// =============================================
// STEP 2: Generate Flashcards
// =============================================
const outputDir = path.join(__dirname, 'output');
// Get the latest transcription file
const files = fs.readdirSync(outputDir)
  .filter(file => file.startsWith('transcription_'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error('No transcription files found');
  process.exit(1);
}

const latestTranscription = fs.readFileSync(path.join(outputDir, files[0]), 'utf8');
generateFlashcards(latestTranscription)
  .then(flashcards => {
    console.log('Flashcards generated successfully');
  })
  .catch(error => console.error('Flashcard generation error:', error));
