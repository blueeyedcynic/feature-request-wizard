import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      company,
      jobDescription,
      problem,
      opportunity,
      dynamicQuestions,
      dynamicAnswers
    } = req.body;

    // Set up Google Sheets authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the row data
    const timestamp = new Date().toISOString();
    const dynamicQuestionsText = dynamicQuestions.join(' | ');
    const dynamicAnswersText = Object.values(dynamicAnswers).join(' | ');

    const rowData = [
      timestamp,
      name,
      email,
      company,
      jobDescription,
      problem,
      opportunity,
      dynamicQuestionsText,
      dynamicAnswersText
    ];

    // Check if sheet has headers, if not, add them
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1:I1',
    });

    if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
      // Add headers
      const headers = [
        'Timestamp',
        'Name',
        'Email',
        'Company',
        'Job Description',
        'Problem',
        'Opportunity',
        'Dynamic Questions',
        'Dynamic Answers'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:I',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Feature request submitted successfully!' 
    });

  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    res.status(500).json({ 
      error: 'Failed to submit feature request',
      details: error.message 
    });
  }
}