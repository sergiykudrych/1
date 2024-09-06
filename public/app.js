const socket = io('/');
const roomId = '123'; // ID комнаты
const localVideo = document.getElementById('local-video');
const remoteVideos = document.getElementById('remote-videos');
const shareScreenButton = document.getElementById('share-screen');
const screenShareDiv = document.getElementById('screen-share');
const peers = {};

// Запрос доступа к камере и микрофону
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localVideo.srcObject = stream;

  socket.emit('join-room', roomId, socket.id);

  socket.on('user-connected', userId => {
    const call = new RTCPeerConnection();
    stream.getTracks().forEach(track => call.addTrack(track, stream));

    call.ontrack = event => {
      const remoteVideo = document.createElement('video');
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      remoteVideos.appendChild(remoteVideo);
    };

    peers[userId] = call;
  });

  socket.on('user-disconnected', userId => {
    if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
    }
  });

  // Получаем поток экрана другого пользователя
  socket.on('screen-shared', screenStream => {
    const remoteScreen = document.createElement('video');
    remoteScreen.srcObject = screenStream;
    remoteScreen.autoplay = true;
    screenShareDiv.innerHTML = ''; // Очистка предыдущего экрана
    screenShareDiv.appendChild(remoteScreen);
  });
});

// Функция для захвата экрана
async function shareScreen() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    localVideo.srcObject = screenStream;

    // Отправляем поток экрана другим участникам
    socket.emit('screen-share', screenStream);

    screenStream.getVideoTracks()[0].onended = () => {
      console.log('Screen sharing stopped');
    };
  } catch (err) {
    console.error('Error sharing the screen:', err);
  }
}

shareScreenButton.onclick = shareScreen;
