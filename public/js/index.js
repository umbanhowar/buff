$(function () {
  // Client ID and API key from the Developer Console
  var CLIENT_ID = '500843274297-j89r2ke0mfhbae2d8b4rd77hfvrvhi1e.apps.googleusercontent.com';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

  var authorizeButton = document.getElementById('authorize-button');
  var signoutButton = document.getElementById('signout-button');

  /**
   *  On load, called to load the auth2 library and API client library.
   */
  function handleClientLoad() {
    console.log("handle client load");
    gapi.load('client:auth2', initClient);
  }

  window.onLoadCallback = function () {
    console.log("on load callback");
    handleClientLoad();
  }

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  function initClient() {
    console.log("init client");
    gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    }).then(function () {
      console.log("init client .then");
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    }, function (error) {
      console.log(error);
    });
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      authorizeButton.style.display = 'none';
      signoutButton.style.display = 'block';
      //listLabels();
      appendMessages();
    } else {
      authorizeButton.style.display = 'block';
      signoutButton.style.display = 'none';
    }
  }

  /**
   *  Sign in the user upon button click.
   */
  function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
  }

  /**
   *  Sign out the user upon button click.
   */
  function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
  }



  function listMessages(userId, query, callback) {
    var getPageOfMessages = function(request, result) {
      request.execute(function(resp) {
        result = result.concat(resp.messages);
        var nextPageToken = resp.nextPageToken;
        if (nextPageToken) {
          request = gapi.client.gmail.users.messages.list({
            'userId': userId,
            'pageToken': nextPageToken,
            'q': query
          });
          getPageOfMessages(request, result);
        } else {
          callback(result);
        }
      });
    };
    var initialRequest = gapi.client.gmail.users.messages.list({
      'userId': userId,
      'q': query
    });
    getPageOfMessages(initialRequest, []);
  }

  function getMessage(userId, messageId, callback) {
    var request = gapi.client.gmail.users.messages.get({
      'userId': userId,
      'id': messageId
    });
    request.execute(callback);
  }

  function appendMessages() {
    listMessages('me', 'cs1320', function (result) {
      if (result && result.length > 0) {
        for (i = 0; i < result.length; i++) {
          var message = result[i];
          // binding the index is kinda hacky, should really use promises
          getMessage('me', message.id, function (idx, message) {
            var iframe = document.createElement('iframe');
            iframe.id = idx;
            document.body.appendChild(iframe);
            var ifr = $('#'+idx)[0];
            ifr.contentDocument.write(getBody(message));

          }.bind(null, i));
        }
      } else {
        appendPre('No result found.');
      }
    });

    function getHeader(headers, index) {
      var header = '';
      $.each(headers, function(){
        if(this.name === index){
          header = this.value;
        }
      });
      return header;
    }

    function getBody(message) {
      var encodedBody = '';
      if(typeof message.payload.parts === 'undefined')
      {
        encodedBody = message.payload.body.data;
      }
      else
      {
        console.log("elsed");
        encodedBody = getHTMLPart(message.payload.parts);
      }
      encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
      return decodeURIComponent(escape(window.atob(encodedBody)));
    }

    function getHTMLPart(arr) {
      for(var x = 0; x <= arr.length; x++)
      {
        if(typeof arr[x].parts === 'undefined')
        {
          // first check for html part
          if(arr[x].mimeType === 'text/html')
          {
            return arr[x].body.data;
          }
          //however, if this is the only part and is plaintext
          if(arr[x].mimeType === 'text/plain' && arr.length === 1)
          {
            return arr[x].body.data;
          }
        }
        else
        {
          return getHTMLPart(arr[x].parts);
        }
      }
      return '';
      }

  }
});
