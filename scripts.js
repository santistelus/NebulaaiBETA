document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('accept-button').addEventListener('click', function() {
    document.getElementById('disclaimer-overlay').style.display = 'none';
  });
});

document.getElementById('report-issue').addEventListener('click', function() {
  window.open('https://tisddev.service-now.com/sp?id=sc_cat_item&sys_id=e415c6b11b898250950d86ecdc4bcbf0', '_blank');
});


document.getElementById('getting-started').addEventListener('click', function() { 
  
  setTimeout(function() {
    window.open('https://docs.google.com/document/d/1FDyuimqaXIHgf09gq7TcdXJInyHLKa1laaddgewdkkc', '_blank');

  }, 500); 
});


document.getElementById('faqs').addEventListener('click', function() { 
  
  
  setTimeout(function() {
    window.open('https://docs.google.com/document/d/1iGQKGuvWS8GbwucKcBGcBfnWr6t32px-Sx53o-100a0', '_blank');

  }, 500); 
});


(async function () {
  const styleOptions = {
    hideUploadButton: false,
    botAvatarInitials: 'NB',         
    botAvatarImage: 'src/botavatar.png',          
    botAvatarBackgroundColor: 'rgb(0,25,49)',
    userAvatarBackgroundColor: 'rgba(75,40,109)',
    userAvatarInitials: 'You'
  };
  const tokenEndpointURL = new URL('https://default38da2016f3ea4b0abb3376eadba89b.d8.environment.api.powerplatform.com/powervirtualagents/botsbyschema/crb36_nebulaAi/directline/token?api-version=2022-03-01-preview');

  const locale = document.documentElement.lang || 'en';

  //TODO:the watermark keeps the conversation after testing, the set value is 1, have to check topics for reiteration
  const apiVersion = tokenEndpointURL.searchParams.get('api-version');
  const watermark = 1; 

      if(!sessionStorage['token']) {
        var [directLineURL, token] = await Promise.all([
          fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpointURL))
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to retrieve regional channel settings.');
              }

              return response.json();
            })
            .then(({ channelUrlsById: { directline } }) => directline),
          fetch(tokenEndpointURL)
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to retrieve Direct Line token.');
              }

              return response.json();
            })
            .then(({ token }) => token)
        ]);

        sessionStorage['token'] = token;
        sessionStorage['directLineURL'] = directLineURL;
        
      } 

      conversationId = sessionStorage['conversationId'];
      var directLine;

      if(conversationId) { 
        directLine = WebChat.createDirectLine({ domain: new URL('v3/directline', sessionStorage['directLineURL']), token: sessionStorage['token'], conversationId: conversationId, watermark: watermark});
      }
      else {
        directLine = WebChat.createDirectLine({ domain: new URL('v3/directline', directLineURL), token: token, watermark: watermark});
      }

  const subscription = directLine.connectionStatus$.subscribe({
    next(value) {
      if (value === 2) {
        sessionStorage['conversationId'] = directLine.conversationId;
        directLine
          .postActivity({
            localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale,
            name: 'startConversation',
            type: 'event',
            value: {DirectLineToken: token}
          })
          .subscribe();

        subscription.unsubscribe();
      }
      // console.log("I was here");
      //console log to see if it goes for each refresh from tab, goes three times?
    }          
  });

 /* document.getElementById('chat-history-button').addEventListener('click', () => {
    sendEventMessage();
  });

  function sendEventMessage() {
    directLine.postActivity({
      type: 'event',
      name: 'PDTestEvent'
    }).subscribe();
  }*/

    // Function to start a new chat session
async function startNewSession() {
  // Clear the existing chat session data
  sessionStorage.removeItem('conversationId');
  sessionStorage.removeItem('token');

  // Generate a new token
  const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer gooUi5ghUEs.vOFyoQ2lkTTAo6kKmxGjxRa2uUhrC5OF_oFEaxgKrUs'
    }
  });
  const { token } = await response.json();

  // Start a new conversation
  const conversationResponse = await fetch('https://directline.botframework.com/v3/directline/conversations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const { conversationId } = await conversationResponse.json();

  // Store the new conversation ID and token
  sessionStorage.setItem('conversationId', conversationId);
  sessionStorage.setItem('token', token);

  const store = window.WebChat.createStore({}, ({ dispatch }) => next => action => {
    if (action.type === 'WEB_CHAT/SET_SEND_BOX') {
      // Clear the send box (input field)
      dispatch({
        type: 'WEB_CHAT/SEND_MESSAGE',
        payload: { text: '' }
      });
    } else if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
      // Reset the conversation history when the connection is established
      dispatch({
        type: 'WEB_CHAT/SEND_POST_ACTIVITY',
        payload: {
          method: 'DELETE',
          activity: { type: 'invoke', name: 'deleteUserData' }
        }
      });
      
      dispatch({
        type: 'WEB_CHAT/SEND_EVENT',
    payload: { name: 'startConversation', value:{conversationId:conversationId} }

      });
    } 
  
    return next(action);
  });

  // console.log(conversationId);
  // console.log("this is after refresh");
  // Assuming you have a reference to the Web Chat component
  window.WebChat.renderWebChat({
    directLine: window.WebChat.createDirectLine({ token }),
    store,styleOptions
  }, document.getElementById('webchat'));
}

// button element with id 'newSession'
const newSessionButton = document.getElementById('restart-chat');
newSessionButton.addEventListener('click', startNewSession);

  window.WebChat.renderWebChat({ directLine, locale, styleOptions }, document.getElementById('webchat'));
})();
