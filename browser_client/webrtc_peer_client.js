'use strict';

window.getRTCStream = () => {
  return new Promise((resolve, reject) => {
    var isInitiator = true;
    var isStarted = false;
    var pc;

    var socket = io.connect('http://localhost:3000');

    socket.on('log', function (array) {
      console.log.apply(console, array);
    });


    function sendMessage(message) {
      console.log('Client sending message: ', message);
      socket.emit('message', message);
    }

    socket.on('message', function (message) {
      console.log('Client received message:', message);
      if (message === 'got user media') {
        //maybeStart();
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          //maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
      }
    });

    function maybeStart() {
      console.log('>>>>>>> maybeStart() ', isStarted);
      if (!isStarted) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
          doCall();
        }
      }
    }

    window.onbeforeunload = function () {
      sendMessage('bye');
    };

    function createPeerConnection() {
      try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        console.log('Created RTCPeerConnnection');
      } catch (e) {
        console.error('Failed to create PeerConnection, exception: ' + e.message);
        reject('Failed to create PeerConnection, exception: ' + e.message)
        return;
      }
    }

    function handleIceCandidate(event) {
      console.log('icecandidate event: ', event);
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    }

    function handleCreateOfferError(event) {
      console.log('createOffer() error: ', event);
    }

    function doCall() {
      console.log('Sending offer to peer');
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError, { offerToReceiveVideo: true });
    }

    function doAnswer() {
      console.log('Sending answer to peer.');
      pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
      );
    }

    function setLocalAndSendMessage(sessionDescription) {
      pc.setLocalDescription(sessionDescription);
      console.log('setLocalAndSendMessage sending message', sessionDescription);
      sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
      trace('Failed to create session description: ' + error.toString());
    }

    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.');
      let remoteStream = event.stream;
      resolve(remoteStream)
    }

    function handleRemoteHangup() {
      console.log('Session terminated.');
      isStarted = false;
      pc.close();
      pc = null;
      isInitiator = false;
    }
    maybeStart();
  })
}

window.getTrackLabel = async () => {
  const stream = await window.getRTCStream();
  return stream.getTracks().find(t => t.kind == 'video').label;
}

//Vencord.Webpack.findStore("MediaEngineStore").getMediaEngine().getDesktopSource = async (a, b) => await getTrackLabel()