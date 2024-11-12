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

async function summarizeText(text) {
  try {
    const summary = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Please provide a concise summary of the following text."
        },
        {
          role: "user",
          content: text
        }
      ],
    });

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-mm-ss

    // Save summary with timestamp
    const summaryPath = path.join(outputDir, `summary_${timestamp}.txt`);
    fs.writeFileSync(summaryPath, summary.choices[0].message.content);
    console.log('Summary saved to:', summaryPath);

    return summary.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarization:', error);
    throw error;
  }
}

async function processAudioFile(inputPath) {
  try {
    console.log('Starting transcription...');
    const transcription = await transcribeAudio(inputPath);
    
    console.log('Starting summarization...');
    await summarizeText(transcription);
    
    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error processing audio file:', error);
  }
}

// Example usage
const inputFile = path.join(__dirname, 'media', 'test.m4a');
processAudioFile(inputFile);
