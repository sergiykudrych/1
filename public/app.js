const socket = io('http://localhost:5500'); // Указываем порт 5500
const roomId = '123';
const localVideo = document.getElementById('local-video');
const remoteVideos = document.getElementById('remote-videos');
const shareScreenButton = document.getElementById('share-screen');
const peers = {};

// Запрос доступа к камере и микрофону
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  localVideo.srcObject = stream;

  socket.emit('join-room', roomId, socket.id);

  socket.on('user-connected', (userId) => {
    const call = new RTCPeerConnection();
    stream.getTracks().forEach((track) => call.addTrack(track, stream));

    call.ontrack = (event) => {
      const remoteVideo = document.createElement('video');
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      remoteVideos.appendChild(remoteVideo);
    };

    peers[userId] = call; // Переместили сюда
  });

  socket.on('user-disconnected', (userId) => {
    if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
    }
  });
});

// Функция для захвата экрана
async function shareScreen() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    screenStream.getTracks().forEach((track) => {
      Object.values(peers).forEach((peer) => {
        peer.addTrack(track, screenStream);
      });
    });

    localVideo.srcObject = screenStream;

    screenStream.getVideoTracks()[0].onended = () => {
      console.log('Screen sharing stopped');
    };
  } catch (err) {
    console.error('Error sharing the screen:', err);
  }
}

shareScreenButton.onclick = shareScreen;
