let mainWrap = document.querySelector(".main-wrap");
let headingMessage = document.querySelector("#headingMessage");
let createChannelForm = document.getElementById("createChannelForm");
let streamWrap = document.getElementById("stream-wrap");
let channelName = document.getElementById("channelName");
let joinBtn = document.getElementById("joinBtn");
let muteMic = document.getElementById("muteMic");
let muteCam = document.getElementById("muteCam");
let flipCamMessage = document.getElementById("flipCamMessage");
let clicked = false;
const APP_ID = "62c1bcd773ea4592bb4f0f5ff8ad6b2e";
let CHANNEL = "main";

let bgEffect = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  document.getElementById("bgPlay").srcObject = localStream;
};

if (!navigator.onLine) {
  bgEffect();
  headingMessage.innerText = "Oops!";
  userMessage.innerHTML = `It seems like you've lost your internet connection. Please 
  check your connection settings and try again when you're back online. We'll be here 
  waiting to assist you once your connection is restored. Thank you!`;
  mainWrap.style = "opacity: 1";
  joinBtn.innerHTML = `<i class="fa-solid fa-arrow-rotate-right"></i>Refresh`;
  createChannelForm.addEventListener("submit", () => {
    window.location.reload();
  });
  joinBtn.addEventListener("click", () => {
    window.location.reload();
  });
} else {
  bgEffect();
  headingMessage.innerText = "Instuctions";
  userMessage.innerHTML = `To join the conversation, please enter the unique <strong>"Room Name"</strong> you received from the invitation link. Once you've <br/> entered the correct Room Name, click on the <strong>"Join"</strong> button, and you'll be seamlessly connected to the room with other participants. If you find the room empty at the moment, please <br/> be patient for a little while, as others may join shortly.`;
  mainWrap.style = "opacity: 1";
  agoraCall();
}

function agoraCall() {
  var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  let localTracks = [];
  let remoteUsers = {};

  let joinAndDisplayLocalStream = async (CHANNEL) => {
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, null, null);

    localTracks = [
      await AgoraRTC.createMicrophoneAudioTrack(),
      await AgoraRTC.createCameraVideoTrack({ facingMode: "user" }),
    ];

    let player = `<div class="video-player" id="user-${UID}"></div>`;

    document
      .getElementById("myVideoPlayer")
      .insertAdjacentHTML("beforeend", player);

    localTracks[1].play(`user-${UID}`);

    await client.publish([localTracks[0], localTracks[1]]);
    document.querySelector("#myVideoPlayer > div > div > video").style =
      "transform: scaleX(-1);";
  };

  let leaveAndRemoveLocalStream = async () => {
    localTracks[0].stop();
    localTracks[1].stop();
    localTracks[0].close();
    localTracks[1].close();

    await client.leave();

    streamWrap.style =
      "top: 100%;  border-top-left-radius: 20px; border-top-right-radius: 20px; transition: 0.5s;";
    setTimeout(() => {
      mainWrap.style = "opacity: 1; transition: 0.5s;";
    }, 200);

    joinBtn.disabled = false;
    clicked = false;
    videoStreams.innerHTML = `<div class="video-container chosen" id="myVideoPlayer"></div>`;
    micIcon.className = "fa-solid fa-microphone";
    camIcon.className = "fa-solid fa-video";
    bgEffect();
  };

  let joinStream = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      window.location.reload();
    } else {
      CHANNEL = channelName.value;
      mainWrap.style = "opacity: 0; transition: 0.5s;";
      setTimeout(() => {
        streamWrap.style = "top: 0; border-radius: 0; transition: 0.5s;";
      }, 200);
      channelName.blur();
      await joinAndDisplayLocalStream(CHANNEL);
      joinBtn.disabled = true;
    }
  };

  let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.id] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === "video") {
      let player = document.getElementById(`user-container-${user.uid}`);
      if (player != null) {
        player.remove();
      }
      player = `
      <div class="video-container" id="user-container-${user.uid}">
        <div class="video-player" id="user-${user.uid}"></div>
      </div>`;

      videoStreams.insertAdjacentHTML("beforeend", player);

      user.videoTrack.play(`user-${user.uid}`);
    }

    let allVideos = document.querySelectorAll(".video-container");
    allVideos.forEach((e) => e.classList.remove("chosen"));

    lastChildDetection();

    allVideos.forEach((item) =>
      item.addEventListener("click", () => {
        allVideos.forEach((i) => i.classList.remove("chosen"));
        item.classList.toggle("chosen");
      })
    );

    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  };

  let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
  };

  let toggleMic = async () => {
    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false);
      micIcon.className = "fa-solid fa-microphone";
    } else {
      await localTracks[0].setMuted(true);
      micIcon.className = "fa-solid fa-microphone-slash";
    }
  };

  let toggleCam = async () => {
    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false);
      camIcon.className = "fa-solid fa-video";
    } else {
      await localTracks[1].setMuted(true);
      camIcon.className = "fa-solid fa-video-slash";
    }
  };

  let flipCam = async () => {
    if (!clicked) {
      clicked = !clicked; // true

      flipCamMessage.style.display = "flex";

      localTracks[1].stop();
      localTracks[1].close();

      await client.leave();

      videoStreams.innerHTML = `<div class="video-container chosen" id="myVideoPlayer"></div>`;

      client.on("user-published", handleUserJoined);
      client.on("user-left", handleUserLeft);

      let UID = await client.join(APP_ID, CHANNEL, null, null);

      localTracks = [
        await AgoraRTC.createMicrophoneAudioTrack(),
        await AgoraRTC.createCameraVideoTrack({ facingMode: "environment" }),
      ];

      let player = `<div class="video-player" id="user-${UID}"></div>`;

      document
        .getElementById("myVideoPlayer")
        .insertAdjacentHTML("beforeend", player);

      localTracks[1].play(`user-${UID}`);

      await client.publish([localTracks[0], localTracks[1]]);

      document.getElementById("myVideoPlayer").style = "transform: scaleX(-1);";
      flipCamMessage.style.display = "none";
    } else {
      clicked = !clicked; // false
      flipCamMessage.style.display = "flex";

      localTracks[1].stop();
      localTracks[1].close();

      await client.leave();

      videoStreams.innerHTML = `<div class="video-container chosen" id="myVideoPlayer"></div>`;

      await joinAndDisplayLocalStream(CHANNEL);
      document.getElementById("myVideoPlayer").style = "transform: scaleX(1)";
      flipCamMessage.style.display = "none";
    }
  };

  createChannelForm.addEventListener("submit", joinStream);
  document
    .querySelector("#leaveBtn")
    .addEventListener("click", leaveAndRemoveLocalStream);
  muteMic.addEventListener("click", toggleMic);
  muteCam.addEventListener("click", toggleCam);
  document.getElementById("rotateCamera").addEventListener("click", flipCam);
}

function lastChildDetection() {
  let fatherEllement = document.querySelector("#videoStreams");

  let lastElementChild = null;
  let currentNode = fatherEllement.lastChild;

  while (currentNode !== null) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      lastElementChild = currentNode;
      break;
    }
    currentNode = currentNode.previousSibling;
  }

  lastElementChild.classList.add("chosen");
}

function handleMutation(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      lastChildDetection();
    }
  }
}

const fatherEllement = document.querySelector("#videoStreams");

const observer = new MutationObserver(handleMutation);
const observerOptions = {
  childList: true,
  subtree: false,
};

observer.observe(fatherEllement, observerOptions);

document.querySelector("#leaveBtn").addEventListener("click", () => {
  setTimeout(() => {
    if (!navigator.onLine) {
      window.location.reload();
    }
  }, 700);
});
