document.addEventListener("DOMContentLoaded", () => {
  // Récupération des éléments DOM
  const createRoomBtn = document.getElementById("create-room");
  const joinRoomBtn = document.getElementById("join-room");
  const leaveRoomBtn = document.getElementById("leave-room");
  const videosContainer = document.getElementById("videos-container");
  const myVideo = document.getElementById("my-video");

  // Variables globales
  let myStream = null;
  let peers = {};
  let roomId = null;
  let isInRoom = false;
  let myId = generateId();

  // 🔹 Génère un identifiant unique
  function generateId() {
    return Math.random().toString(36).substring(2, 10);
  }

  // 🔹 Lance la caméra et le micro
  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      myVideo.srcObject = stream;
      myStream = stream;
      return stream;
    } catch (err) {
      alert("❌ Impossible d'accéder à la caméra/micro.");
      console.error(err);
      return null;
    }
  }

  // 🔹 Création d'une salle
  function createRoom() {
    if (isInRoom) {
      alert("Vous êtes déjà dans une salle.");
      return;
    }
    roomId = generateId();
    isInRoom = true;
    startVideo();
    alert(`✅ Salle créée ! ID : ${roomId}`);
  }

  // 🔹 Rejoindre une salle existante
  function joinRoom() {
    if (isInRoom) {
      alert("Vous êtes déjà dans une salle.");
      return;
    }
    const inputId = prompt("Entrez l'ID de la salle :");
    if (!inputId) return;

    roomId = inputId;
    isInRoom = true;
    startVideo();
    alert(`🔗 Rejoint la salle : ${roomId}`);
  }

  // 🔹 Quitter la salle
  function leaveRoom() {
    if (!isInRoom) {
      alert("Vous n'êtes dans aucune salle.");
      return;
    }

    // Détruire toutes les connexions
    Object.values(peers).forEach(peer => peer.destroy());
    peers = {};

    // Retirer toutes les vidéos sauf la mienne
    const peerVideos = videosContainer.querySelectorAll(".video-card:not(:first-child)");
    peerVideos.forEach(card => card.remove());

    isInRoom = false;
    roomId = null;
    alert("🚪 Vous avez quitté la salle.");
  }

  // 🔹 Connexion avec un pair
  function connectToPeer(peerId, initiator = false) {
    if (peers[peerId]) return; // Déjà connecté

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: myStream
    });

    peers[peerId] = peer;

    peer.on("signal", data => {
      console.log("Signal envoyé :", data);
      // Normalement on transmet via WebSocket ici
    });

    peer.on("connect", () => {
      console.log(`✅ Connecté à ${peerId}`);
      addVideoElement(peerId);
    });

    peer.on("stream", stream => {
      const videoEl = document.getElementById(`video-${peerId}`);
      if (videoEl) {
        videoEl.srcObject = stream;
      }
    });

    peer.on("close", () => {
      console.log(`❌ Déconnecté de ${peerId}`);
      removeVideoElement(peerId);
      delete peers[peerId];
    });

    peer.on("error", err => {
      console.error(`Erreur peer ${peerId}:`, err);
    });
  }

  // 🔹 Ajouter une vidéo
  function addVideoElement(peerId) {
    if (document.getElementById(`video-${peerId}`)) return;

    const card = document.createElement("div");
    card.className = "video-card glass-card";
    card.innerHTML = `
      <video id="video-${peerId}" autoplay playsinline></video>
      <span class="label">Participant (${peerId})</span>
    `;
    videosContainer.appendChild(card);
  }

  // 🔹 Supprimer une vidéo
  function removeVideoElement(peerId) {
    const el = document.getElementById(`video-${peerId}`);
    if (el) {
      el.closest(".video-card").remove();
    }
  }

  // 🎛 Événements
  createRoomBtn.addEventListener("click", createRoom);
  joinRoomBtn.addEventListener("click", joinRoom);
  leaveRoomBtn.addEventListener("click", leaveRoom);

  // ⚡ Auto-lancement vidéo au chargement
  startVideo();
});
