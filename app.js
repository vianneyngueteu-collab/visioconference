document.addEventListener('DOMContentLoaded', function() {
            // Éléments DOM
            const createRoomBtn = document.getElementById('create-room');
            const joinRoomBtn = document.getElementById('join-room');
            const leaveRoomBtn = document.getElementById('leave-room');
            const offerTextarea = document.getElementById('offer');
            const incomingForm = document.getElementById('incoming');
            const myVideo = document.getElementById('my-video');
            const connectionStatus = document.getElementById('connection-status');
            const copyOfferBtn = document.getElementById('copy-offer');
            const clearInputBtn = document.getElementById('clear-input');
            const videosContainer = document.getElementById('videos-container');
            const myIdSpan = document.getElementById('my-id');
            const roomInfo = document.getElementById('room-info');
            const roomIdSpan = document.getElementById('room-id');
            const participantsCount = document.getElementById('participants-count');
            const participantsList = document.getElementById('participants-list');
            
            // Variables d'état
            let myStream = null;
            let myId = generateId();
            let peers = {}; // Stocke toutes les connexions peers
            let roomId = null;
            let isInRoom = false;
            
            // Générer un ID unique
            function generateId() {
                return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
            
            // Mettre à jour le statut de connexion
            function updateStatus(message, type = 'info') {
                connectionStatus.textContent = message;
                connectionStatus.className = 'status';
                
                switch(type) {
                    case 'connected':
                        connectionStatus.classList.add('connected');
                        connectionStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
                        break;
                    case 'error':
                        connectionStatus.classList.add('error');
                        connectionStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                        break;
                    default:
                        connectionStatus.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
                }
                
                // Mettre à jour l'ID affiché
                myIdSpan.textContent = myId;
                offerTextarea.value = myId;
            }
            
            // Démarrer la capture vidéo
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
                    console.error('Erreur lors de l\'accès à la caméra:', err);
                    updateStatus('Erreur: Impossible d\'accéder à la caméra/microphone', 'error');
                    return null;
                }
            }
            
            // Créer une nouvelle salle
            function createRoom() {
                if (isInRoom) {
                    updateStatus('Vous êtes déjà dans une salle', 'error');
                    return;
                }
                
                roomId = generateId();
                isInRoom = true;
                updateRoomInfo();
                updateStatus(`Salle créée avec l'ID: ${roomId}. Partagez cet ID avec d'autres participants.`);
                
                // Démarrer la vidéo
                startVideo();
            }
            
            // Rejoindre une salle existante
            function joinRoom() {
                if (isInRoom) {
                    updateStatus('Vous êtes déjà dans une salle', 'error');
                    return;
                }
                
                const roomIdPrompt = prompt("Entrez l'ID de la salle à rejoindre:");
                if (!roomIdPrompt) return;
                
                roomId = roomIdPrompt;
                isInRoom = true;
                updateRoomInfo();
                updateStatus(`Vous avez rejoint la salle: ${roomId}`);
                
                // Démarrer la vidéo
                startVideo();
                
                // Dans une vraie implémentation, vous vous connecteriez à un serveur de signalisation
                // Pour cette démo, nous allons simuler la connexion à d'autres pairs
                simulatePeerConnections();
            }
            
            // Quitter la salle
            function leaveRoom() {
                if (!isInRoom) {
                    updateStatus('Vous n\'êtes dans aucune salle', 'error');
                    return;
                }
                
                // Fermer toutes les connexions peers
                Object.values(peers).forEach(peer => {
                    peer.destroy();
                });
                peers = {};
                
                // Réinitialiser l'état
                isInRoom = false;
                roomId = null;
                updateRoomInfo();
                
                // Supprimer toutes les vidéos des autres participants
                const peerVideos = videosContainer.querySelectorAll('.video-card:not(:first-child)');
                peerVideos.forEach(video => video.remove());
                
                updateStatus('Vous avez quitté la salle');
            }
            
            // Mettre à jour les informations de la salle
            function updateRoomInfo() {
                if (isInRoom) {
                    roomInfo.style.display = 'block';
                    roomIdSpan.textContent = roomId;
                    updateParticipantsList();
                } else {
                    roomInfo.style.display = 'none';
                }
            }
            
            // Mettre à jour la liste des participants
            function updateParticipantsList() {
                const participantCount = Object.keys(peers).length + 1; // +1 pour moi
                participantsCount.textContent = participantCount;
                
                // Vider la liste
                participantsList.innerHTML = '';
                
                // Ajouter moi-même
                const myItem = document.createElement('div');
                myItem.className = 'participant-item';
                myItem.innerHTML = `
                    <span class="participant-name">Moi (${myId.substring(0, 8)}...)</span>
                    <span class="participant-status connected">Connecté</span>
                `;
                participantsList.appendChild(myItem);
                
                // Ajouter les autres participants
                Object.keys(peers).forEach(peerId => {
                    const peerItem = document.createElement('div');
                    peerItem.className = 'participant-item';
                    peerItem.innerHTML = `
                        <span class="participant-name">Participant (${peerId.substring(0, 8)}...)</span>
                        <span class="participant-status connected">Connecté</span>
                    `;
                    participantsList.appendChild(peerItem);
                });
            }
            
            // Établir une connexion avec un pair spécifique
            function connectToPeer(peerId, initiator = false) {
                // Vérifier si nous sommes déjà connectés à ce pair
                if (peers[peerId]) {
                    console.log(`Déjà connecté à ${peerId}`);
                    return;
                }
                
                // Créer un nouveau pair
                const peer = new SimplePeer({
                    initiator: initiator,
                    trickle: false,
                    stream: myStream
                });
                
                // Stocker la connexion
                peers[peerId] = peer;
                
                // Gérer les données de signalisation
                peer.on('signal', function(data) {
                    // Dans une vraie implémentation, vous enverriez ces données via un serveur de signalisation
                    console.log('Signal data:', data);
                    
                    // Pour cette démo, nous allons simuler l'échange de signaux
                    if (initiator) {
                        // Simuler la réception du signal par le pair distant
                        setTimeout(() => {
                            simulateSignalResponse(peerId, data);
                        }, 1000);
                    }
                });
                
                // Quand la connexion est établie
                peer.on('connect', function() {
                    console.log(`Connecté à ${peerId}`);
                    updateStatus(`Connecté à un nouveau participant (${peerId.substring(0, 8)}...)`, 'connected');
                    updateParticipantsList();
                    
                    // Ajouter l'élément vidéo pour ce pair
                    addVideoElement(peerId);
                });
                
                // Quand un flux est reçu
                peer.on('stream', function(stream) {
                    console.log(`Flux reçu de ${peerId}`);
                    // Associer le flux à l'élément vidéo correspondant
                    const videoElement = document.getElementById(`video-${peerId}`);
                    if (videoElement) {
                        videoElement.srcObject = stream;
                    }
                });
                
                // Gérer les erreurs
                peer.on('error', function(err) {
                    console.error(`Erreur avec le pair ${peerId}:`, err);
                    updateStatus(`Erreur de connexion avec un participant`, 'error');
                    
                    // Nettoyer
                    delete peers[peerId];
                    removeVideoElement(peerId);
                    updateParticipantsList();
                });
                
                // Quand la connexion est fermée
                peer.on('close', function() {
                    console.log(`Connexion fermée avec ${peerId}`);
                    delete peers[peerId];
                    removeVideoElement(peerId);
                    updateParticipantsList();
                });
            }
            
            // Ajouter un élément vidéo pour un pair
            function addVideoElement(peerId) {
                // Vérifier si l'élément existe déjà
                if (document.getElementById(`video-${peerId}`)) {
                    return;
                }
                
                const videoCard = document.createElement('div');
                videoCard.className = 'video-card';
                videoCard.innerHTML = `
                    <div class="video-header">
                        <div>
                            <i class="fas fa-user"></i> Participant
                        </div>
                        <div class="peer-id">${peerId.substring(0, 8)}...</div>
                    </div>
                    <video id="video-${peerId}" autoplay playsinline></video>
                `;
                
                videosContainer.appendChild(videoCard);
            }
            
            // Supprimer l'élément vidéo d'un pair
            function removeVideoElement(peerId) {
                const videoElement = document.getElementById(`video-${peerId}`);
                if (videoElement) {
                    videoElement.closest('.video-card').remove();
                }
            }
            
            // Simuler la réponse de signalisation d'un pair distant
            function simulateSignalResponse(peerId, signalData) {
                // Dans une vraie implémentation, le pair distant enverrait sa réponse
                // Pour cette démo, nous allons créer un pair "distant" simulé
                const remotePeer = new SimplePeer({
                    initiator: false,
                    trickle: false
                });
                
                // Traiter le signal reçu
                remotePeer.signal(signalData);
                
                // Quand le pair distant génère sa réponse
                remotePeer.on('signal', function(data) {
                    // Renvoyer la réponse au pair initial
                    const initialPeer = peers[peerId];
                    if (initialPeer) {
                        initialPeer.signal(data);
                    }
                });
                
                // Quand le pair distant reçoit le flux
                remotePeer.on('stream', function(stream) {
                    // Simuler l'envoi d'un flux vidéo
                    // Dans une vraie implémentation, ce serait la vidéo du pair distant
                });
            }
            
            // Simuler des connexions à d'autres pairs (pour la démo)
            function simulatePeerConnections() {
                // Simuler la connexion à quelques pairs
                const simulatedPeerIds = [
                    generateId(),
                    generateId(),
                    generateId()
                ];
                
                simulatedPeerIds.forEach(peerId => {
                    // Attendre un peu avant de simuler chaque connexion
                    setTimeout(() => {
                        connectToPeer(peerId, true);
                    }, Math.random() * 3000 + 1000);
                });
            }
            
            // Événements des boutons
            createRoomBtn.addEventListener('click', createRoom);
            joinRoomBtn.addEventListener('click', joinRoom);
            leaveRoomBtn.addEventListener('click', leaveRoom);
            
            // Soumission du formulaire de connexion directe
            incomingForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const textarea = this.querySelector('textarea');
                const peerId = textarea.value.trim();
                
                if (!peerId) {
                    updateStatus('Veuillez entrer un ID de participant', 'error');
                    return;
                }
                
                if (!myStream) {
                    updateStatus('Veuillez d\'abord activer votre caméra', 'error');
                    return;
                }
                
                // Se connecter au pair
                connectToPeer(peerId, true);
                textarea.value = '';
            });
            
            // Copier l'ID dans le presse-papier
            copyOfferBtn.addEventListener('click', function() {
                if (!myId) {
                    updateStatus('Aucun ID à copier', 'error');
                    return;
                }
                
                navigator.clipboard.writeText(myId).then(() => {
                    updateStatus('ID copié dans le presse-papier');
                    
                    // Feedback visuel
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copié!';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Erreur lors de la copie:', err);
                    updateStatus('Erreur lors de la copie', 'error');
                });
            });
            
            // Effacer le champ de saisie
            clearInputBtn.addEventListener('click', function() {
                const textarea = incomingForm.querySelector('textarea');
                textarea.value = '';
                updateStatus('Champ effacé');
            });
            
            // Initialisation
            updateStatus('Prêt à établir des connexions multi-utilisateurs');
            myIdSpan.textContent = myId;
            offerTextarea.value = myId;
        });
    