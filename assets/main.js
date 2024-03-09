
async function displayLastPublicCommentAndTranslate(client) {
  try {
      const ticketId = await client.get('ticket.id');
      
      const response = await client.request({
          url: `/api/v2/tickets/${ticketId['ticket.id']}/comments.json`,
          type: 'GET',
          dataType: 'json'
      });

      const publicComments = response.comments.filter(comment => comment.public);
      
      const lastPublicComment = publicComments[publicComments.length - 1];
      
      if (lastPublicComment) {
          const translatedText = await getTranslation(client, lastPublicComment.plain_body);
          document.getElementById('translationOutput').innerHTML = translatedText;
      } else {
          document.getElementById('translationOutput').innerText = "No public comments found.";
      }
  } catch (e) {
      console.error('Error:', e);
      document.getElementById('translationOutput').innerText = `Error: ${e.message || e.toString()}`;
  }
}

async function getTranslation(client, text) {
  const prompt = `Generate a summary of the following text '${text}' in English. Then create bulletpoints for the keypoints of the text. Translate the following text to English: '${text}'.
                  The estructure of your reply should be always:

                  <strong>Summary:</strong>
                  
                  "the summary of the text"

                  --------------------------------------

                  <strong>Keypoints:</strong>
                  
                  "the bulletpoints created"

                  --------------------------------------

                  <strong>Translation:</strong>

                  "Translation of the text"

  
                  If text is already in English, create the summary and just past the same content for the translation.`;

  const options = {
      url: "https://api.openai.com/v1/chat/completions",
      type: "POST",
      contentType: "application/json",
      headers: {
          Authorization: "Bearer {{setting.openAiApiToken}}", 
      },
      data: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
      }),
      secure: true,
  };

  try {
      const response = await client.request(options);
      if (response.choices && response.choices[0] && response.choices[0].message) {
          return response.choices[0].message.content.trim().replace(/(?:\r\n|\r|\n)/g, '<br>');
      } else {
          throw new Error('Unexpected response structure from OpenAI');
      }
  } catch (e) {
      console.error('Error with OpenAI request:', e);
      throw new Error(`Translation request failed: ${e.statusText || e.message || 'Unknown error'}`);
  }
}

function load() {
  const client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '600px' });
  displayLastPublicCommentAndTranslate(client);
}
